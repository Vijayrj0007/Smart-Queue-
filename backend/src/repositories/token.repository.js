/**
 * Token repository — raw SQL for tokens, queue counter updates, notifications in transactions
 */

const { query } = require('../config/db');

// ——— Queries using pool `query` ———

const findMyActiveTokens = (userId) =>
  query(
    `SELECT t.*, q.name as queue_name, q.prefix, q.now_serving, q.avg_service_time, q.status as queue_status,
            l.name as location_name, l.type as location_type, l.address as location_address,
            (SELECT COUNT(*) FROM tokens t2 
             WHERE t2.queue_id = t.queue_id 
             AND t2.status = 'waiting' 
             AND (t2.is_priority > t.is_priority OR (t2.is_priority = t.is_priority AND t2.position < t.position))
            ) as people_ahead
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.user_id = $1 AND t.status IN ('waiting', 'called', 'serving')
     ORDER BY t.booked_at DESC`,
    [userId]
  );

const countTokensByUser = (userId) =>
  query(`SELECT COUNT(*) as count FROM tokens WHERE user_id = $1`, [userId]);

const findHistoryPage = (userId, limit, offset) =>
  query(
    `SELECT t.*, q.name as queue_name, q.prefix,
            l.name as location_name, l.type as location_type
     FROM tokens t
     JOIN queues q ON q.id = t.queue_id
     JOIN locations l ON l.id = q.location_id
     WHERE t.user_id = $1
     ORDER BY t.booked_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

const findCancellableByUser = (tokenId, userId) =>
  query(
    `SELECT t.*, q.name as queue_name FROM tokens t JOIN queues q ON q.id = t.queue_id
     WHERE t.id = $1 AND t.user_id = $2 AND t.status IN ('waiting', 'called')`,
    [tokenId, userId]
  );

const setTokenCancelled = (tokenId) =>
  query(`UPDATE tokens SET status = 'cancelled', completed_at = datetime('now') WHERE id = $1`, [tokenId]);

const findQueueTokensForAdmin = (queueId, status) => {
  let conditions = ['t.queue_id = $1', "date(t.booked_at) = date('now')"];
  const params = [queueId];
  if (status) {
    conditions.push('t.status = $2');
    params.push(status);
  }
  return query(
    `SELECT t.*, u.name as user_name, u.phone as user_phone, u.email as user_email
     FROM tokens t
     JOIN users u ON u.id = t.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.is_priority DESC, t.position ASC`,
    params
  );
};

const findByIdAndStatus = (tokenId, statuses) => {
  const placeholders = statuses.map((_, i) => `$${i + 2}`).join(', ');
  return query(`SELECT * FROM tokens WHERE id = $1 AND status IN (${placeholders})`, [tokenId, ...statuses]);
};

const findByIdWaiting = (tokenId) =>
  query(`SELECT * FROM tokens WHERE id = $1 AND status = 'waiting'`, [tokenId]);

const updateTokenServing = (tokenId) =>
  query(`UPDATE tokens SET status = 'serving', serving_at = datetime('now') WHERE id = $1`, [tokenId]);

const updateTokenCompleted = (tokenId) =>
  query(`UPDATE tokens SET status = 'completed', completed_at = datetime('now') WHERE id = $1`, [tokenId]);

const updateTokenSkipped = (tokenId) =>
  query(`UPDATE tokens SET status = 'skipped', completed_at = datetime('now') WHERE id = $1`, [tokenId]);

const updateTokenPriority = (tokenId, isPriority, priorityReason) =>
  query(`UPDATE tokens SET is_priority = $1, priority_reason = $2 WHERE id = $3`, [
    isPriority,
    priorityReason,
    tokenId,
  ]);

const insertSkipNotification = (userId, message) =>
  query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, 'Token Skipped', $2, 'warning')`,
    [userId, message]
  );

// ——— Client (transaction) methods ———

const clientFindActiveQueue = (client, queueId) =>
  client.query('SELECT * FROM queues WHERE id = $1 AND status = $2', [queueId, 'active']);

const clientFindExistingActiveToken = (client, queueId, userId) =>
  client.query(
    `SELECT id FROM tokens WHERE queue_id = $1 AND user_id = $2 AND status IN ('waiting', 'called', 'serving')`,
    [queueId, userId]
  );

const clientCountActiveTokensInQueue = (client, queueId) =>
  client.query(
    `SELECT COUNT(*) as count FROM tokens WHERE queue_id = $1 AND status IN ('waiting', 'called', 'serving')`,
    [queueId]
  );

const clientIncrementQueueNumber = (client, queueId) =>
  client.query(
    `UPDATE queues SET current_number = current_number + 1, updated_at = datetime('now') WHERE id = $1`,
    [queueId]
  );

const clientGetQueueCounter = (client, queueId) =>
  client.query('SELECT current_number, prefix FROM queues WHERE id = $1', [queueId]);

const clientInsertToken = (client, tokenNumber, queueId, userId, position, estimatedWait, notes) =>
  client.query(
    `INSERT INTO tokens (token_number, queue_id, user_id, status, position, estimated_wait, notes)
     VALUES ($1, $2, $3, 'waiting', $4, $5, $6)
     RETURNING *`,
    [tokenNumber, queueId, userId, position, estimatedWait, notes]
  );

const clientLocationNameForQueue = (client, queueId) =>
  client.query(
    'SELECT l.name as location_name FROM locations l JOIN queues q ON q.location_id = l.id WHERE q.id = $1',
    [queueId]
  );

const clientInsertBookingNotification = (client, userId, title, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, $2, $3, 'success', $4)`,
    [userId, title, message, dataJson]
  );

const clientFindTokenWaiting = (client, tokenId) =>
  client.query(`SELECT * FROM tokens WHERE id = $1 AND status = 'waiting'`, [tokenId]);

const clientSetTokenCalled = (client, tokenId) =>
  client.query(`UPDATE tokens SET status = 'called', called_at = datetime('now') WHERE id = $1`, [tokenId]);

const clientUpdateQueueNowServing = (client, position, queueId) =>
  client.query(`UPDATE queues SET now_serving = $1, updated_at = datetime('now') WHERE id = $2`, [position, queueId]);

const clientInsertTurnNotification = (client, userId, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, 'Your Turn!', $2, 'turn_called', $3)`,
    [userId, message, dataJson]
  );

const clientFindUpcomingWaiting = (client, queueId, afterPosition) =>
  client.query(
    `SELECT id, user_id, token_number, position FROM tokens 
     WHERE queue_id = $1 AND status = 'waiting' AND position > $2
     ORDER BY is_priority DESC, position ASC LIMIT 3`,
    [queueId, afterPosition]
  );

const clientInsertApproachingNotification = (client, userId, message, dataJson) =>
  client.query(
    `INSERT INTO notifications (user_id, title, message, type, data)
     VALUES ($1, 'Turn Approaching', $2, 'turn_approaching', $3)`,
    [userId, message, dataJson]
  );

const clientCompleteServingInQueue = (client, queueId) =>
  client.query(
    `UPDATE tokens SET status = 'completed', completed_at = datetime('now')
     WHERE queue_id = $1 AND status IN ('called', 'serving')`,
    [queueId]
  );

const clientFindNextWaitingToken = (client, queueId) =>
  client.query(
    `SELECT * FROM tokens 
     WHERE queue_id = $1 AND status = 'waiting'
     ORDER BY is_priority DESC, position ASC 
     LIMIT 1`,
    [queueId]
  );

module.exports = {
  findMyActiveTokens,
  countTokensByUser,
  findHistoryPage,
  findCancellableByUser,
  setTokenCancelled,
  findQueueTokensForAdmin,
  findByIdAndStatus,
  findByIdWaiting,
  updateTokenServing,
  updateTokenCompleted,
  updateTokenSkipped,
  updateTokenPriority,
  insertSkipNotification,
  clientFindActiveQueue,
  clientFindExistingActiveToken,
  clientCountActiveTokensInQueue,
  clientIncrementQueueNumber,
  clientGetQueueCounter,
  clientInsertToken,
  clientLocationNameForQueue,
  clientInsertBookingNotification,
  clientFindTokenWaiting,
  clientSetTokenCalled,
  clientUpdateQueueNowServing,
  clientInsertTurnNotification,
  clientFindUpcomingWaiting,
  clientInsertApproachingNotification,
  clientCompleteServingInQueue,
  clientFindNextWaitingToken,
};
