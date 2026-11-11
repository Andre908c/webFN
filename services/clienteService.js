const db = require('../config/db');
const userModel = require('../models/userModel');
const accountModel = require('../models/accountModel');
const authService = require('./authService');

async function getPerfil(usuarioId) {
  const user = await userModel.findById(usuarioId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  const cuenta = await accountModel.findByUsuarioId(usuarioId);
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    estado: user.estado,
    cuenta: cuenta
      ? {
          id: cuenta.id,
          numero_cuenta: cuenta.numero_cuenta,
          tipo: cuenta.tipo,
          estado: cuenta.estado
        }
      : null
  };
}

async function getSaldo(usuarioId) {
  const cuenta = await accountModel.findByUsuarioId(usuarioId);
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  return {
    numero_cuenta: cuenta.numero_cuenta,
    saldo: Number(cuenta.saldo),
    tipo: cuenta.tipo,
    estado: cuenta.estado
  };
}

async function getMovimientos(usuarioId, limit = 20) {
  const cuenta = await accountModel.findByUsuarioId(usuarioId);
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  const [rows] = await db.query(
    `SELECT id, tipo_movimiento AS tipo, monto, saldo_anterior, saldo_posterior,
            descripcion, created_at
     FROM movimientos
     WHERE cuenta_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [cuenta.id, Number(limit)]
  );
  return rows;
}

async function updatePerfil(usuarioId, { nombre }) {
  if (!nombre || String(nombre).trim().length < 2) {
    const err = new Error('Nombre inválido');
    err.status = 400;
    throw err;
  }
  const [result] = await db.query(
    'UPDATE usuarios SET nombre = ? WHERE id = ?',
    [String(nombre).trim(), usuarioId]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return getPerfil(usuarioId);
}

async function cambiarPassword(usuarioId, passwordActual, passwordNueva) {
  if (!passwordActual || !passwordNueva || String(passwordNueva).length < 6) {
    const err = new Error('Datos de contraseña inválidos (mínimo 6 caracteres)');
    err.status = 400;
    throw err;
  }

  const user = await userModel.findById(usuarioId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  // Necesitamos el hash: findById no lo devuelve, consultamos de nuevo
  const [rows] = await db.query(
    'SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1',
    [usuarioId]
  );
  const hash = rows[0]?.password_hash;
  if (!hash) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  const ok = await authService.verifyPassword(passwordActual, hash);
  if (!ok) {
    const err = new Error('Contraseña actual incorrecta');
    err.status = 401;
    throw err;
  }

  const nuevoHash = await authService.hashPassword(passwordNueva);
  await userModel.updatePassword(usuarioId, nuevoHash);
  return { message: 'Contraseña actualizada' };
}

module.exports = {
  getPerfil,
  getSaldo,
  getMovimientos,
  updatePerfil,
  cambiarPassword
};