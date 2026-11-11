# FASE 5 – Transferencias entre Cuentas

## Objetivo
Transferir dinero entre cuentas con transacción atómica (2 movimientos).

## Archivos a crear / modificar

### 1. `services/transferenciaService.js`
```js
const db = require('../config/db');
const accountModel = require('../models/accountModel');

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

  const destino = await accountModel.findByNumeroCuenta(numeroCuentaDestino);
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

  const estadoOk = (e) => e === 'ACTIVO' || e === 'ACTIVA';
  if (!estadoOk(origen.estado) || !estadoOk(destino.estado)) {
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

    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [saldoOrigenPost, origen.id]);
    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [saldoDestinoPost, destino.id]);

    const desc = descripcion || `Transferencia a ${destino.numero_cuenta}`;

    await conn.query(
      `INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, cuenta_destino_id, descripcion)
       VALUES (?, 'TRANSFERENCIA_SALIDA', ?, ?, ?, ?, ?)`,
      [origen.id, cantidad, saldoOrigenAnt, saldoOrigenPost, destino.id, desc]
    );

    await conn.query(
      `INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, cuenta_destino_id, descripcion)
       VALUES (?, 'TRANSFERENCIA_ENTRADA', ?, ?, ?, ?, ?)`,
      [destino.id, cantidad, saldoDestinoAnt, saldoDestinoPost, origen.id, `Transferencia desde ${origen.numero_cuenta}`]
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
```

### 2. Agregar en `controllers/clienteController.js`
```js
const transferenciaService = require('../services/transferenciaService');

async function transferir(req, res) {
  try {
    const { numero_cuenta_destino, monto, descripcion } = req.body;
    const data = await transferenciaService.transferir(
      req.session.user.id,
      numero_cuenta_destino,
      monto,
      descripcion
    );
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// exportar también transferir
```

### 3. Agregar en `routes/clienteRoutes.js`
```js
router.post('/transferir', clienteController.transferir);
```

## Criterio de aceptación
- Si cualquier parte falla → ROLLBACK completo
- Se registran 2 movimientos (salida + entrada)
