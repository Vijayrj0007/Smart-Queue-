-- Migration 003: Create queues table
-- Service queues within locations (e.g., "General OPD", "Billing Counter")

CREATE TABLE IF NOT EXISTS queues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prefix TEXT DEFAULT 'A',
  current_number INTEGER DEFAULT 0,
  now_serving INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 100,
  avg_service_time INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_queues_location ON queues(location_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
