/**
 * Queue repository — raw SQL for queues table and related reads
 */
const { query } = require('../config/db');

const findWithLocationById = (id) =>
  query(
    `SELECT q.*, l.name as location_name, l.type as location_type, l.address as location_address
     FROM queues q
     JOIN locations l ON l.id = q.location_id
     WHERE q.id = $1`,
    [id]
  );

const findWaitingTokensByQueueId = (queueId) =>
  query(
    `SELECT t.id, t.token_number, t.position, t.is_priority, t.estimated_wait, t.status, t.booked_at,
            u.name as user_name
     FROM tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.queue_id = $1 AND t.status IN ('waiting', 'called', 'serving')
     ORDER BY t.is_priority DESC, t.position ASC`,
    [queueId]
  );

const getTodayStatsByQueueId = (queueId) =>
  query(
    `SELECT 
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN status = 'serving' THEN 1 END) as serving_count,
      COUNT(CASE WHEN status IN ('completed', 'skipped') AND date(booked_at) = date('now') THEN 1 END) as today_served,
      COALESCE(AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND called_at IS NOT NULL
        THEN (julianday(completed_at) - julianday(called_at)) * 1440 END), 0) as avg_service_time
     FROM tokens
     WHERE queue_id = $1 AND date(booked_at) = date('now')`,
    [queueId]
  );

const insert = (locationId, name, description, prefix, maxCapacity, avgServiceTime) =>
  query(
    `INSERT INTO queues (location_id, name, description, prefix, max_capacity, avg_service_time)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [locationId, name, description, prefix, maxCapacity, avgServiceTime]
  );

const updateById = (id, name, description, prefix, maxCapacity, avgServiceTime, status) =>
  query(
    `UPDATE queues SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      prefix = COALESCE($3, prefix),
      max_capacity = COALESCE($4, max_capacity),
      avg_service_time = COALESCE($5, avg_service_time),
      status = COALESCE($6, status),
      updated_at = datetime('now')
     WHERE id = $7
     RETURNING *`,
    [name, description, prefix, maxCapacity, avgServiceTime, status, id]
  );

const findSummaryById = (id) => query('SELECT id, name FROM queues WHERE id = $1', [id]);

const deleteById = (id) => query('DELETE FROM queues WHERE id = $1', [id]);

const resetCounters = (id) =>
  query(
    `UPDATE queues SET current_number = 0, now_serving = 0, updated_at = datetime('now') WHERE id = $1`,
    [id]
  );

const cancelWaitingTokensForQueue = (queueId) =>
  query(
    `UPDATE tokens SET status = 'cancelled' WHERE queue_id = $1 AND status IN ('waiting', 'called')`,
    [queueId]
  );

module.exports = {
  findWithLocationById,
  findWaitingTokensByQueueId,
  getTodayStatsByQueueId,
  insert,
  updateById,
  findSummaryById,
  deleteById,
  resetCounters,
  cancelWaitingTokensForQueue,
};
