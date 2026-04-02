-- Migration 002: Create locations table
-- Stores hospitals, clinics, offices that use the queue system

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'office', 'bank', 'government')),
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  image_url TEXT,
  operating_hours TEXT DEFAULT '{"open": "09:00", "close": "17:00", "days": ["Mon","Tue","Wed","Thu","Fri"]}',
  is_active INTEGER DEFAULT 1,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_admin ON locations(admin_id);
