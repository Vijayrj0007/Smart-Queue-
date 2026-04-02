-- Migration 004: Create tokens table
-- Digital tokens/bookings that users receive when joining a queue

CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_number TEXT NOT NULL,
  queue_id INTEGER NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
  is_priority INTEGER DEFAULT 0,
  priority_reason TEXT,
  position INTEGER NOT NULL,
  booked_at DATETIME DEFAULT (datetime('now')),
  called_at DATETIME,
  serving_at DATETIME,
  completed_at DATETIME,
  estimated_wait INTEGER,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tokens_queue ON tokens(queue_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_booked_at ON tokens(booked_at);
CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
