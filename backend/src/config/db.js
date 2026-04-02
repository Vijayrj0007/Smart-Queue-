/**
 * Database Configuration — SQLite via better-sqlite3
 * Provides a PostgreSQL-compatible query interface for seamless migration.
 * 
 * API: query(sql, params) returns { rows: [...] }
 *      getClient() returns a client with query/release/BEGIN/COMMIT/ROLLBACK
 */
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/smartqueue.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Connected to SQLite database at', DB_PATH);

/**
 * Convert PostgreSQL-style $1, $2 parameterized queries to SQLite ? placeholders
 */
function convertParams(sql, params) {
  if (!params || params.length === 0) return { sql, params: [] };
  
  let converted = sql;
  // Replace $N placeholders with ? — must go in reverse order to avoid $1 replacing part of $10
  const matches = [...sql.matchAll(/\$(\d+)/g)];
  if (matches.length === 0) return { sql, params: params || [] };

  // Build a map of parameter positions
  const paramPositions = [];
  // Sort matches by position in string (they should already be in order)
  for (const match of matches) {
    paramPositions.push(parseInt(match[1]));
  }

  // Replace all $N with ? and build ordered params array
  const orderedParams = [];
  let lastIndex = 0;
  let newSql = '';
  
  for (const match of matches) {
    newSql += converted.substring(lastIndex, match.index) + '?';
    orderedParams.push(params[parseInt(match[1]) - 1]);
    lastIndex = match.index + match[0].length;
  }
  newSql += converted.substring(lastIndex);

  return { sql: newSql, params: orderedParams };
}

/**
 * Convert PostgreSQL-specific SQL syntax to SQLite equivalents
 */
function adaptSQL(sql) {
  let adapted = sql;
  
  // SERIAL PRIMARY KEY → INTEGER PRIMARY KEY AUTOINCREMENT
  adapted = adapted.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  
  // TIMESTAMP WITH TIME ZONE → DATETIME
  adapted = adapted.replace(/TIMESTAMP\s+WITH\s+TIME\s+ZONE/gi, 'DATETIME');
  adapted = adapted.replace(/TIMESTAMP/gi, 'DATETIME');
  
  // VARCHAR(N) → TEXT (SQLite doesn't enforce varchar lengths, but accepts the syntax)
  // Actually SQLite accepts VARCHAR so leave it
  
  // JSONB → TEXT
  adapted = adapted.replace(/\bJSONB\b/gi, 'TEXT');
  
  // BOOLEAN → INTEGER (SQLite stores booleans as 0/1)
  // Actually SQLite accepts BOOLEAN so leave it
  
  // NOW() → datetime('now')
  adapted = adapted.replace(/\bNOW\(\)/gi, "datetime('now')");
  
  // CURRENT_DATE → date('now')
  adapted = adapted.replace(/\bCURRENT_DATE\b/gi, "date('now')");
  
  // ILIKE → LIKE (SQLite LIKE is case-insensitive for ASCII by default)
  adapted = adapted.replace(/\bILIKE\b/gi, 'LIKE');
  
  // ::date cast → date()
  adapted = adapted.replace(/(\w+)::date/gi, "date($1)");
  
  // EXTRACT(HOUR FROM col) → cast(strftime('%H', col) as integer)
  adapted = adapted.replace(/EXTRACT\s*\(\s*HOUR\s+FROM\s+(\w+)\s*\)/gi, 
    "cast(strftime('%H', $1) as integer)");
  
  // EXTRACT(EPOCH FROM (expr)) / 60 → (julianday(expr_end) - julianday(expr_start)) * 1440
  // This is complex — handle specific patterns
  adapted = adapted.replace(
    /EXTRACT\s*\(\s*EPOCH\s+FROM\s*\((\w+)\s*-\s*(\w+)\)\s*\)\s*\/\s*60/gi,
    "(julianday($1) - julianday($2)) * 1440"
  );
  
  // INTERVAL '1 day' * $N → '-' || ? || ' days'  (handled differently)
  adapted = adapted.replace(
    /CURRENT_DATE\s*-\s*INTERVAL\s*'1\s*day'\s*\*\s*\?/gi,
    "date('now', '-' || ? || ' days')"
  );
  
  // INTERVAL '7 days' → '-7 days' (for date arithmetic)
  adapted = adapted.replace(
    /date\('now'\)\s*-\s*INTERVAL\s*'(\d+)\s*days?'/gi,
    "date('now', '-$1 days')"
  );
  
  // COALESCE with ::numeric cast
  adapted = adapted.replace(/::numeric/gi, '');
  
  // ROUND(expr, N) already works in SQLite
  
  // ON DELETE SET NULL — supported in SQLite
  // ON DELETE CASCADE — supported in SQLite
  
  return adapted;
}

/**
 * Execute a query with optional parameters (pg-compatible interface)
 * @param {string} text - SQL query string (using $1, $2 params)
 * @param {Array} params - Query parameters
 * @returns {{ rows: Object[], rowCount: number }}
 */
const query = (text, params) => {
  let adapted = adaptSQL(text);
  const converted = convertParams(adapted, params);
  
  const trimmed = converted.sql.trim().toUpperCase();
  const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
  const hasReturning = /\bRETURNING\b/i.test(converted.sql);
  
  if (process.env.NODE_ENV === 'development') {
    const preview = text.substring(0, 80).replace(/\n/g, ' ');
    // console.log('🔍 Query:', { text: preview });
  }

  try {
    if (isSelect) {
      const rows = db.prepare(converted.sql).all(...converted.params);
      return { rows, rowCount: rows.length };
    } else if (hasReturning) {
      // SQLite doesn't support RETURNING natively. Simulate it.
      const returningMatch = converted.sql.match(/\bRETURNING\s+(.+)$/i);
      const sqlWithoutReturning = converted.sql.replace(/\s+RETURNING\s+.+$/i, '');
      
      const info = db.prepare(sqlWithoutReturning).run(...converted.params);
      
      if (returningMatch) {
        const columns = returningMatch[1].trim();
        const table = extractTableName(sqlWithoutReturning);
        
        if (table) {
          let fetchSql;
          if (sqlWithoutReturning.trim().toUpperCase().startsWith('INSERT')) {
            fetchSql = `SELECT ${columns} FROM ${table} WHERE rowid = ?`;
            const rows = db.prepare(fetchSql).all(info.lastInsertRowid);
            return { rows, rowCount: rows.length };
          } else if (sqlWithoutReturning.trim().toUpperCase().startsWith('UPDATE') || 
                     sqlWithoutReturning.trim().toUpperCase().startsWith('DELETE')) {
            // For UPDATE/DELETE with RETURNING, we need to fetch before or use changes
            // Since we already ran the statement, we need a different approach
            // Re-run with a subquery approach
            if (info.changes > 0 && sqlWithoutReturning.trim().toUpperCase().startsWith('DELETE')) {
              // For DELETE, data is already gone — return empty or use special handling
              return { rows: [{ id: null }], rowCount: info.changes };
            }
            // For UPDATE, find the updated rows
            const whereMatch = sqlWithoutReturning.match(/\bWHERE\b\s+(.+)$/i);
            if (whereMatch) {
              // Re-extract params for the WHERE clause
              const whereClause = whereMatch[1];
              const fetchSql2 = `SELECT ${columns} FROM ${table} WHERE ${whereClause}`;
              // We need the same params that were in the WHERE clause
              // This is tricky — use a simpler approach for UPDATE RETURNING
              try {
                const rows = db.prepare(fetchSql2).all(...converted.params.slice(-countPlaceholders(whereClause)));
                return { rows, rowCount: rows.length };
              } catch {
                return { rows: [], rowCount: info.changes };
              }
            }
            return { rows: [], rowCount: info.changes };
          }
        }
      }
      return { rows: [], rowCount: info.changes };
    } else {
      const info = db.prepare(converted.sql).run(...converted.params);
      return { rows: [], rowCount: info.changes };
    }
  } catch (error) {
    console.error('SQLite Query Error:', error.message);
    console.error('SQL:', converted.sql.substring(0, 200));
    throw error;
  }
};

/**
 * Extract table name from SQL statement
 */
function extractTableName(sql) {
  const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  if (insertMatch) return insertMatch[1];
  
  const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (updateMatch) return updateMatch[1];
  
  const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (deleteMatch) return deleteMatch[1];
  
  return null;
}

/**
 * Count ? placeholders in a string
 */
function countPlaceholders(str) {
  return (str.match(/\?/g) || []).length;
}

/**
 * Get a client for transactions (pg-compatible interface)
 * Returns an object with query(), release(), and transaction methods
 */
const getClient = async () => {
  const client = {
    _inTransaction: false,
    
    query: async (text, params) => {
      if (text === 'BEGIN') {
        db.prepare('BEGIN').run();
        client._inTransaction = true;
        return { rows: [], rowCount: 0 };
      }
      if (text === 'COMMIT') {
        db.prepare('COMMIT').run();
        client._inTransaction = false;
        return { rows: [], rowCount: 0 };
      }
      if (text === 'ROLLBACK') {
        try {
          db.prepare('ROLLBACK').run();
        } catch (e) {
          // Ignore if no transaction active
        }
        client._inTransaction = false;
        return { rows: [], rowCount: 0 };
      }
      return query(text, params);
    },
    
    release: () => {
      // SQLite doesn't need connection release
      if (client._inTransaction) {
        try {
          db.prepare('ROLLBACK').run();
        } catch (e) {}
        client._inTransaction = false;
      }
    }
  };
  
  return client;
};

/**
 * Get the raw database instance (for direct access in migrations)
 */
const getDb = () => db;

module.exports = { query, getClient, getDb, pool: { end: () => db.close() } };
