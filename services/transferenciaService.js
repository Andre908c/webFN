const db = require('../config/db');
const accountModel = require('../models/accountModel');

function isActiva(estado) {
  return estado === 'ACTIVO' || estado === 'ACTIVA';
}

async function transferir(usuarioId, numeroCuentaDestino, monto, descripcion = '') {
  const cantidad = Number(monto);
  if (!cantidad || cantidad <= 0) {
    const err = new Error('Monto inválido');
    err.status = 400;
    throw err;
  }
  if (!numeroCuentaDestino) {
    const err = new Error('Cuenta destino obligatoria');
    err.status = 400;
    throw err;
  }

  const origen = await accountModel.findByUsuarioId(usuarioId);
  if (!origen) {
    const err = new Error('Cuenta origen no encontrada');
    err.status = 404;
    throw err;
  }

  const destino = await accountModel.findByNumeroCuenta(String(numeroCuentaDestino).trim());
  if (!destino) {
    const err = new Error('Cuenta destino no encontrada');
    err.status = 404;
    throw err;
  }

  if (origen.id === destino.id) {
    const err = new Error('No puede transferir a la misma cuenta');
    err.status = 400;
    throw err;
  }

  if (!isActiva(origen.estado) || !isActiva(destino.estado)) {
    const err = new Error('Ambas cuentas deben estar activas');
    err.status = 403;
    throw err;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rowsOrigen] = await conn.query(
      'SELECT id, saldo FROM cuentas WHERE id = ? FOR UPDATE',
      [origen.id]
    );
    const [rowsDestino] = await conn.query(
      'SELECT id, saldo FROM cuentas WHERE id = ? FOR UPDATE',
      [destino.id]
    );

    const cOrigen = rowsOrigen[0];
    const cDestino = rowsDestino[0];

    if (Number(cOrigen.saldo) < cantidad) {
      throw Object.assign(new Error('Saldo insuficiente'), { status: 400 });
    }

    const saldoOrigenAnt = Number(cOrigen.saldo);
    const saldoOrigenPost = saldoOrigenAnt - cantidad;
    const saldoDestinoAnt = Number(cDestino.saldo);
    const saldoDestinoPost = saldoDestinoAnt + cantidad;

    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [
      saldoOrigenPost,
      origen.id
    ]);
    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [
      saldoDestinoPost,
      destino.id
    ]);

    const desc = descripcion || `Transferencia a ${destino.numero_cuenta}`;

    await conn.query(
      `INSERT INTO movimientos
        (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, cuenta_destino_id, descripcion)
       VALUES (?, 'TRANSFERENCIA_SALIDA', ?, ?, ?, ?, ?)`,
      [origen.id, cantidad, saldoOrigenAnt, saldoOrigenPost, destino.id, desc]
    );

    await conn.query(
      `INSERT INTO movimientos
        (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, cuenta_destino_id, descripcion)
       VALUES (?, 'TRANSFERENCIA_ENTRADA', ?, ?, ?, ?, ?)`,
      [
        destino.id,
        cantidad,
        saldoDestinoAnt,
        saldoDestinoPost,
        origen.id,
        `Transferencia desde ${origen.numero_cuenta}`
      ]
    );

    await conn.commit();

    return {
      mensaje: 'Transferencia exitosa',
      monto: cantidad,
      origen: origen.numero_cuenta,
      destino: destino.numero_cuenta,
      saldo_nuevo_origen: saldoOrigenPost
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { transferir };