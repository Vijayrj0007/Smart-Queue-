/**
 * Queue service — business rules for queue operations
 */
const queueRepository = require('../repositories/queue.repository');
const locationRepository = require('../repositories/location.repository');

async function getQueueById(id) {
  const queueResult = await queueRepository.findWithLocationById(id);
  if (queueResult.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  const [waitingResult, statsResult] = await Promise.all([
    queueRepository.findWaitingTokensByQueueId(id),
    queueRepository.getTodayStatsByQueueId(id),
  ]);

  return {
    ok: true,
    data: {
      queue: queueResult.rows[0],
      tokens: waitingResult.rows,
      stats: statsResult.rows[0],
    },
  };
}

async function createQueue(body) {
  const { location_id, name, description, prefix, max_capacity, avg_service_time } = body;

  const locationCheck = await locationRepository.existsById(location_id);
  if (locationCheck.rows.length === 0) {
    return { ok: false, status: 404, message: 'Location not found.' };
  }

  const result = await queueRepository.insert(
    location_id,
    name,
    description,
    prefix || 'A',
    max_capacity || 100,
    avg_service_time || 5
  );

  return { ok: true, status: 201, message: 'Queue created successfully.', data: result.rows[0] };
}

async function updateQueue(id, body) {
  const { name, description, prefix, max_capacity, avg_service_time, status } = body;
  const result = await queueRepository.updateById(
    id,
    name,
    description,
    prefix,
    max_capacity,
    avg_service_time,
    status
  );

  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  return { ok: true, message: 'Queue updated successfully.', data: result.rows[0] };
}

async function deleteQueue(id) {
  const existing = await queueRepository.findSummaryById(id);
  if (existing.rows.length === 0) {
    return { ok: false, status: 404, message: 'Queue not found.' };
  }

  await queueRepository.deleteById(id);
  return {
    ok: true,
    message: `Queue "${existing.rows[0].name}" deleted successfully.`,
  };
}

async function resetQueue(id) {
  await queueRepository.resetCounters(id);
  await queueRepository.cancelWaitingTokensForQueue(id);
  return { ok: true, message: 'Queue reset successfully.' };
}

module.exports = {
  getQueueById,
  createQueue,
  updateQueue,
  deleteQueue,
  resetQueue,
};
