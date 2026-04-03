-- Migration 006: Multi-tenant Organizations (Service Providers)
-- Adds organizations table and links queues to an organization via organization_id.
-- Backward compatible: existing queues are assigned to a "Default Organization".

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  type TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Ensure a default organization exists (idempotent)
INSERT OR IGNORE INTO organizations (id, name, email, password_hash, type)
VALUES (1, 'Default Organization', 'default@smartqueue.local', '__NO_LOGIN__', 'default');

-- Add organization_id to queues (SQLite: add column)
ALTER TABLE queues ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE RESTRICT;

-- Backfill existing queues to default org
UPDATE queues SET organization_id = 1 WHERE organization_id IS NULL;

-- Helpful index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_queues_org ON queues(organization_id);

