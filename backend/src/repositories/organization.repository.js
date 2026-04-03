/**
 * Organization repository — raw SQL for organizations table
 */
const { query } = require('../config/db');

const findIdByEmail = (email) =>
  query('SELECT id FROM organizations WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);

const insertOrganization = (name, email, passwordHash, type) =>
  query(
    `INSERT INTO organizations (name, email, password_hash, type)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, type, created_at`,
    [name, email, passwordHash, type || null]
  );

const findByEmailForLogin = (email) =>
  query(
    'SELECT id, name, email, password_hash, type, created_at FROM organizations WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
    [email]
  );

const findById = (id) =>
  query('SELECT id, name, email, type, created_at FROM organizations WHERE id = $1', [id]);

module.exports = {
  findIdByEmail,
  insertOrganization,
  findByEmailForLogin,
  findById,
};

