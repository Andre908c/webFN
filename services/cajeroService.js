
const bcrypt = require('bcrypt');
const db = require('../config/db');
const accountModel = require('../models/accountModel');

function isActiva(estado) {
  return estado === 'ACTIVO' || estado === 'ACTIVA';
}

async function loginCajero(numeroCuenta, pin) {
  if (!numeroCuenta || !pin) {
    const err = new Error('Número de cuenta y PIN son obligatorios');
    err.status = 400;
    throw err;
  }

  const cuenta = await accountModel.findByNumeroCuenta(String(numeroCuenta).trim());
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }

  if (!isActiva(cuenta.estado)) {
    const err = new Error('Cuenta no activa');
    err.status = 403;
    throw err;
  }

  const ok = await bcrypt.compare(String(pin), cuenta.pin_hash);
  if (!ok) {
    const err = new Error('PIN incorrecto');
    err.status = 401;
    throw err;
  }

  return {
    cuentaId: cuenta.id,
    numero_cuenta: cuenta.numero_cuenta,
    tipo: cuenta.tipo,
    estado: cuenta.estado
  };
}

async function getSaldo(cuentaId) {
  const cuenta = await accountModel.findById(cuentaId);
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  return {
    numero_cuenta: cuenta.numero_cuenta,
    saldo: Number(cuenta.saldo)
  };
}

async function getUltimosMovimientos(cuentaId, limit = 10) {
  const [rows] = await db.query(
    `SELECT id, tipo_movimiento AS tipo, monto, descripcion, created_at
     FROM movimientos
     WHERE cuenta_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [cuentaId, Number(limit)]
  );
  return rows;
}

async function retirar(cuentaId, monto) {
  const cantidad = Number(monto);
  if (!cantidad || cantidad <= 0) {
    const err = new Error('Monto inválido');
    err.status = 400;
    throw err;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT id, saldo, estado FROM cuentas WHERE id = ? FOR UPDATE',
      [cuentaId]
    );
    const cuenta = rows[0];
    if (!cuenta) {
      throw Object.assign(new Error('Cuenta no encontrada'), { status: 404 });
    }
    if (!isActiva(cuenta.estado)) {
      throw Object.assign(new Error('Cuenta no activa'), { status: 403 });
    }
    if (Number(cuenta.saldo) < cantidad) {
      throw Object.assign(new Error('Saldo insuficiente'), { status: 400 });
    }

    const saldoAnterior = Number(cuenta.saldo);
    const saldoPosterior = saldoAnterior - cantidad;

    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [
      saldoPosterior,
      cuentaId
    ]);
    await conn.query(
      `INSERT INTO movimientos
        (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, descripcion)
       VALUES (?, 'RETIRO', ?, ?, ?, ?)`,
      [
        cuentaId,
        cantidad,
        saldoAnterior,
        saldoPosterior,
        'Retiro en cajero automático'
      ]
    );

    await conn.commit();
    return {
      mensaje: 'Retiro exitoso',
      monto: cantidad,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoPosterior
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  loginCajero,
  getSaldo,
  getUltimosMovimientos,
  retirar
};