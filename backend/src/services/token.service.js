/**
 * Token service — booking, lifecycle, and real-time side effects
 */
const { getClient } = require('../config/db');
const tokenRepository = require('../repositories/token.repository');
const { emitQueueUpdate, emitTokenCalledToQueue } = require('../socket/queue.socket');
const { emitYourTurn } = require('../socket/notification.socket');

function mapMyTokens(rows) {
  return rows.map((token) => ({
    ...token,
    estimated_wait: Math.max(0, parseInt(token.people_ahead, 10) * parseInt(token.avg_service_time, 10)),
    people_ahead: parseInt(token.people_ahead, 10),
  }));
}

async function bookToken(body, user, io) {
  const { queue_id, notes } = body;
  const userId = user.id;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const queueResult = await tokenRepository.clientFindActiveQueue(client, queue_id);
    if (queueResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'Queue not found or is not active.' };
    }

    const queue = queueResult.rows[0];

    const existingToken = await tokenRepository.clientFindExistingActiveToken(client, queue_id, userId);
    if (existingToken.rows.length > 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 409, message: 'You already have an active token in this queue.' };
    }

    const waitingCount = await tokenRepository.clientCountActiveTokensInQueue(client, queue_id);
    if (parseInt(waitingCount.rows[0].count, 10) >= queue.max_capacity) {
      await client.query('ROLLBACK');
      return { ok: false, status: 400, message: 'This queue is currently full. Please try again later.' };
    }

    await tokenRepository.clientIncrementQueueNumber(client, queue_id);
    const updatedQueue = await tokenRepository.clientGetQueueCounter(client, queue_id);
    const newNumber = updatedQueue.rows[0].current_number;
    const prefix = updatedQueue.rows[0].prefix;
    const tokenNumber = `${prefix}${String(newNumber).padStart(3, '0')}`;
    const position = parseInt(waitingCount.rows[0].count, 10) + 1;
    const estimatedWait = position * queue.avg_service_time;

    const tokenResult = await tokenRepository.clientInsertToken(
      client,
      tokenNumber,
      queue_id,
      userId,
      position,
      estimatedWait,
      notes
    );

    const locationResult = await tokenRepository.clientLocationNameForQueue(client, queue_id);
    const locationName = locationResult.rows[0]?.location_name || 'Unknown';

    await tokenRepository.clientInsertBookingNotification(
      client,
      userId,
      'Token Booked Successfully',
      `Your token ${tokenNumber} has been booked for ${queue.name} at ${locationName}. Position: ${position}, Estimated wait: ${estimatedWait} minutes.`,
      JSON.stringify({
        token_id: tokenResult.rows[0].id,
        queue_id,
        token_number: tokenNumber,
      })
    );

    await client.query('COMMIT');

    const token = tokenResult.rows[0];
    emitQueueUpdate(io, queue_id, {
      type: 'new-token',
      queueId: queue_id,
      token: {
        id: token.id,
        tokenNumber: token.token_number,
        position: token.position,
        status: token.status,
      },
    });

    return {
      ok: true,
      status: 201,
      message: `Token ${tokenNumber} booked successfully!`,
      data: {
        ...token,
        queue_name: queue.name,
        location_name: locationResult.rows[0]?.location_name,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Book token error:', error);
    return { ok: false, status: 500, message: 'Failed to book token.' };
  } finally {
    client.release();
  }
}

async function getMyTokens(userId) {
  const result = await tokenRepository.findMyActiveTokens(userId);
  return { ok: true, data: mapMyTokens(result.rows) };
}

async function getTokenHistory(userId, queryParams) {
  const { page = 1, limit = 20 } = queryParams;
  const offset = (page - 1) * limit;

  const countResult = await tokenRepository.countTokensByUser(userId);
  const result = await tokenRepository.findHistoryPage(userId, parseInt(limit, 10), parseInt(offset, 10));
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    ok: true,
    data: {
      tokens: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

async function cancelToken(tokenId, userId, io) {
  const existing = await tokenRepository.findCancellableByUser(tokenId, userId);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be cancelled.' };
  }

  await tokenRepository.setTokenCancelled(tokenId);
  const token = existing.rows[0];

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-cancelled',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  return {
    ok: true,
    message: `Token ${token.token_number} cancelled successfully.`,
    data: { ...token, status: 'cancelled' },
  };
}

async function getQueueTokens(queueId, status) {
  const result = await tokenRepository.findQueueTokensForAdmin(queueId, status);
  return { ok: true, data: result.rows };
}

async function callToken(tokenId, io) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existing = await tokenRepository.clientFindTokenWaiting(client, tokenId);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'Token not found or not in waiting status.' };
    }

    await tokenRepository.clientSetTokenCalled(client, tokenId);
    const token = { ...existing.rows[0], status: 'called', called_at: new Date().toISOString() };

    await tokenRepository.clientUpdateQueueNowServing(client, token.position, token.queue_id);

    await tokenRepository.clientInsertTurnNotification(
      client,
      token.user_id,
      `Token ${token.token_number} has been called! Please proceed to the counter.`,
      JSON.stringify({ token_id: token.id, queue_id: token.queue_id })
    );

    const upcomingTokens = await tokenRepository.clientFindUpcomingWaiting(client, token.queue_id, token.position);
    for (const upcoming of upcomingTokens.rows) {
      const positionsAhead = upcoming.position - token.position;
      if (positionsAhead <= 3) {
        await tokenRepository.clientInsertApproachingNotification(
          client,
          upcoming.user_id,
          `Your turn is approaching! You are ${positionsAhead} position(s) away. Token: ${upcoming.token_number}`,
          JSON.stringify({
            token_id: upcoming.id,
            queue_id: token.queue_id,
            positions_ahead: positionsAhead,
          })
        );
      }
    }

    await client.query('COMMIT');

    emitTokenCalledToQueue(io, token.queue_id, {
      id: token.id,
      tokenNumber: token.token_number,
      position: token.position,
      userId: token.user_id,
    });
    emitYourTurn(io, token.user_id, {
      tokenNumber: token.token_number,
      queueId: token.queue_id,
    });

    return { ok: true, message: `Token ${token.token_number} has been called.`, data: token };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Call token error:', error);
    return { ok: false, status: 500, message: 'Failed to call token.' };
  } finally {
    client.release();
  }
}

async function serveToken(tokenId) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['called']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or not called.' };
  }

  await tokenRepository.updateTokenServing(tokenId);
  const token = { ...existing.rows[0], status: 'serving' };
  return { ok: true, message: `Token ${token.token_number} is now being served.`, data: token };
}

async function completeToken(tokenId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['called', 'serving']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be completed.' };
  }

  await tokenRepository.updateTokenCompleted(tokenId);
  const token = { ...existing.rows[0], status: 'completed' };

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-completed',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  return { ok: true, message: `Token ${token.token_number} completed.`, data: token };
}

async function skipToken(tokenId, io) {
  const existing = await tokenRepository.findByIdAndStatus(tokenId, ['waiting', 'called']);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or cannot be skipped.' };
  }

  await tokenRepository.updateTokenSkipped(tokenId);
  const token = { ...existing.rows[0], status: 'skipped' };

  await tokenRepository.insertSkipNotification(
    token.user_id,
    `Your token ${token.token_number} has been skipped. Please contact the counter for assistance.`
  );

  emitQueueUpdate(io, token.queue_id, {
    type: 'token-skipped',
    queueId: token.queue_id,
    tokenId: token.id,
  });

  return { ok: true, message: `Token ${token.token_number} skipped.`, data: token };
}

async function setPriority(tokenId, body, io) {
  const { is_priority, priority_reason } = body;
  const existing = await tokenRepository.findByIdWaiting(tokenId);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Token not found or not waiting.' };
  }

  const priorityVal = is_priority !== false ? 1 : 0;
  const reason = priority_reason || 'Emergency';
  await tokenRepository.updateTokenPriority(tokenId, priorityVal, reason);
  const token = { ...existing.rows[0], is_priority: priorityVal, priority_reason: reason };

  emitQueueUpdate(io, token.queue_id, {
    type: 'priority-changed',
    queueId: token.queue_id,
    tokenId: token.id,
    isPriority: token.is_priority,
  });

  return {
    ok: true,
    message: `Token ${token.token_number} priority ${token.is_priority ? 'enabled' : 'disabled'}.`,
    data: token,
  };
}

async function callNextToken(queueId, io) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    await tokenRepository.clientCompleteServingInQueue(client, queueId);

    const nextToken = await tokenRepository.clientFindNextWaitingToken(client, queueId);
    if (nextToken.rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, message: 'No more tokens waiting in this queue.' };
    }

    const token = nextToken.rows[0];
    await tokenRepository.clientSetTokenCalled(client, token.id);
    await tokenRepository.clientUpdateQueueNowServing(client, token.position, queueId);

    await tokenRepository.clientInsertTurnNotification(
      client,
      token.user_id,
      `Token ${token.token_number} has been called! Please proceed to the counter.`,
      JSON.stringify({ token_id: token.id, queue_id: queueId })
    );

    await client.query('COMMIT');

    const qid = parseInt(queueId, 10);
    emitTokenCalledToQueue(io, qid, {
      id: token.id,
      tokenNumber: token.token_number,
      position: token.position,
      userId: token.user_id,
    });
    emitYourTurn(io, token.user_id, {
      tokenNumber: token.token_number,
      queueId: qid,
    });

    return {
      ok: true,
      message: `Token ${token.token_number} has been called.`,
      data: { ...token, status: 'called', called_at: new Date() },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Call next token error:', error);
    return { ok: false, status: 500, message: 'Failed to call next token.' };
  } finally {
    client.release();
  }
}

module.exports = {
  bookToken,
  getMyTokens,
  getTokenHistory,
  cancelToken,
  getQueueTokens,
  callToken,
  serveToken,
  completeToken,
  skipToken,
  setPriority,
  callNextToken,
};
