-- Migration 007: Queue Governance — 3-Actor Status Model
-- Changes queue status from (active, paused, closed) to (pending, active, inactive).
-- Provider creates → status = pending
-- Admin activates → status = active  (visible to users)
-- Admin deactivates → status = inactive

-- SQLite cannot ALTER CHECK constraints, so we recreate the table.

-- 1. Create new table with updated CHECK constraint
CREATE TABLE queues_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  prefix TEXT DEFAULT 'A',
  current_number INTEGER DEFAULT 0,
  now_serving INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 100,
  avg_service_time INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- 2. Copy data, mapping old statuses to new ones
INSERT INTO queues_new (id, location_id, organization_id, name, description, prefix, current_number, now_serving, max_capacity, avg_service_time, status, created_at, updated_at)
  SELECT id, location_id, organization_id, name, description, prefix, current_number, now_serving, max_capacity, avg_service_time,
    CASE
      WHEN status = 'active' THEN 'active'
      WHEN status = 'paused' THEN 'inactive'
      WHEN status = 'closed' THEN 'inactive'
      ELSE 'pending'
    END,
    created_at, updated_at
  FROM queues;

-- 3. Drop old table and rename
DROP TABLE queues;

ALTER TABLE queues_new RENAME TO queues;

-- 4. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_queues_location ON queues(location_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_org ON queues(organization_id);
