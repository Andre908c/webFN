const db = require('../config/db');

async function findByEmail(email) {
  const [rows] = await db.query(
    'SELECT id, nombre, email, password_hash, rol, estado FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    'SELECT id, nombre, email, rol, estado, created_at FROM usuarios WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  const [result] = await db.query(
    'UPDATE usuarios SET password_hash = ? WHERE id = ?',
    [passwordHash, id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findByEmail,
  findById,
  updatePassword
};
