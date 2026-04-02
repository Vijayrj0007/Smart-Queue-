/**
 * Analytics repository — reporting queries
 */
const { query } = require('../config/db');

const getTodayTokenStats = () =>
  query(`
    SELECT 
      COUNT(*) as total_tokens_today,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_now,
      COUNT(CASE WHEN status IN ('called', 'serving') THEN 1 END) as serving_now,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_today,
      COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_today,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND completed_at IS NOT NULL AND called_at IS NOT NULL
        THEN (julianday(completed_at) - julianday(called_at)) * 1440 END
      ), 1), 0) as avg_service_time,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND called_at IS NOT NULL AND booked_at IS NOT NULL
        THEN (julianday(called_at) - julianday(booked_at)) * 1440 END
      ), 1), 0) as avg_wait_time
    FROM tokens
    WHERE date(booked_at) = date('now')
  `);

const countActiveQueues = () => query(`SELECT COUNT(*) as count FROM queues WHERE status = 'active'`);

const countActiveLocations = () => query(`SELECT COUNT(*) as count FROM locations WHERE is_active = 1`);

const countUsers = () => query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);

const getBusiestQueuesToday = () =>
  query(`
    SELECT q.id, q.name, l.name as location_name,
      COUNT(t.id) as token_count,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count
    FROM queues q
    JOIN locations l ON l.id = q.location_id
    LEFT JOIN tokens t ON t.queue_id = q.id AND date(t.booked_at) = date('now')
    WHERE q.status = 'active'
    GROUP BY q.id, q.name, l.name
    ORDER BY token_count DESC
    LIMIT 5
  `);

const getRecentActivityToday = () =>
  query(`
    SELECT t.token_number, t.status, t.booked_at, t.called_at, t.completed_at,
           u.name as user_name, q.name as queue_name
    FROM tokens t
    JOIN users u ON u.id = t.user_id
    JOIN queues q ON q.id = t.queue_id
    WHERE date(t.booked_at) = date('now')
    ORDER BY t.booked_at DESC
    LIMIT 10
  `);

const getDailyStats = (days) =>
  query(
    `
    SELECT 
      date(booked_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped,
      COALESCE(ROUND(AVG(
        CASE WHEN status = 'completed' AND called_at IS NOT NULL AND booked_at IS NOT NULL
        THEN (julianday(called_at) - julianday(booked_at)) * 1440 END
      ), 1), 0) as avg_wait_time
    FROM tokens
    WHERE booked_at >= date('now', '-' || $1 || ' days')
    GROUP BY date(booked_at)
    ORDER BY date DESC
  `,
    [days]
  );

const getWaitTimeStats = () =>
  query(`
    SELECT q.id, q.name as queue_name, l.name as location_name,
      COUNT(t.id) as total_tokens,
      COALESCE(ROUND(AVG(
        CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
        THEN (julianday(t.called_at) - julianday(t.booked_at)) * 1440 END
      ), 1), 0) as avg_wait_time,
      COALESCE(ROUND(AVG(
        CASE WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.called_at IS NOT NULL
        THEN (julianday(t.completed_at) - julianday(t.called_at)) * 1440 END
      ), 1), 0) as avg_service_time,
      COALESCE(MAX(
        CASE WHEN t.status = 'completed' AND t.called_at IS NOT NULL AND t.booked_at IS NOT NULL
        THEN (julianday(t.called_at) - julianday(t.booked_at)) * 1440 END
      ), 0) as max_wait_time
    FROM queues q
    JOIN locations l ON l.id = q.location_id
    LEFT JOIN tokens t ON t.queue_id = q.id AND t.booked_at >= date('now', '-7 days')
    GROUP BY q.id, q.name, l.name
    ORDER BY avg_wait_time DESC
  `);

const getHourlyStatsToday = () =>
  query(`
    SELECT 
      cast(strftime('%H', booked_at) as integer) as hour,
      COUNT(*) as count
    FROM tokens
    WHERE date(booked_at) = date('now')
    GROUP BY strftime('%H', booked_at)
    ORDER BY hour
  `);

module.exports = {
  getTodayTokenStats,
  countActiveQueues,
  countActiveLocations,
  countUsers,
  getBusiestQueuesToday,
  getRecentActivityToday,
  getDailyStats,
  getWaitTimeStats,
  getHourlyStatsToday,
};
