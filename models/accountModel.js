const db = require('../config/db');

async function findByUsuarioId(usuarioId) {
  const [rows] = await db.query(
    `SELECT id, numero_cuenta, usuario_id, saldo, tipo, estado, created_at
     FROM cuentas WHERE usuario_id = ? LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

async function findByNumeroCuenta(numeroCuenta) {
  const [rows] = await db.query(
    `SELECT id, numero_cuenta, usuario_id, saldo, pin_hash, tipo, estado
     FROM cuentas WHERE numero_cuenta = ? LIMIT 1`,
    [numeroCuenta]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT id, numero_cuenta, usuario_id, saldo, tipo, estado
     FROM cuentas WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  findByUsuarioId,
  findByNumeroCuenta,
  findById
};
