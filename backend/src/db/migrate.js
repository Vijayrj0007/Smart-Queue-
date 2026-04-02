/**
 * Database Migration Runner — SQLite version
 * Executes SQL migration files in order, tracking which have been run
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/smartqueue.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');

    // Ensure migrations tracking table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT (datetime('now'))
      );
    `);

    // Get already executed migrations
    const executed = db.prepare('SELECT name FROM migrations ORDER BY name').all();
    const executedNames = new Set(executed.map(r => r.name));

    // Read migration files in order
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let migrationsRun = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  ⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`  📄 Running ${file}...`);
      
      const transaction = db.transaction(() => {
        // Split by semicolons and run each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const stmt of statements) {
          db.exec(stmt.trim() + ';');
        }
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      });

      try {
        transaction();
        console.log(`  ✅ ${file} completed successfully`);
        migrationsRun++;
      } catch (err) {
        console.error(`  ❌ ${file} failed:`, err.message);
        throw err;
      }
    }

    if (migrationsRun === 0) {
      console.log('\n✨ All migrations are up to date!');
    } else {
      console.log(`\n✅ Successfully ran ${migrationsRun} migration(s).`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

runMigrations();
