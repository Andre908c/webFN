# FASE 4 – Cajero Automático Virtual

## Objetivo
Simular un cajero con número de cuenta + PIN. Retiros atómicos.

## Archivos a crear

### 1. `services/cajeroService.js`
```js
const bcrypt = require('bcrypt');
const db = require('../config/db');
const accountModel = require('../models/accountModel');

async function loginCajero(numeroCuenta, pin) {
  if (!numeroCuenta || !pin) {
    const err = new Error('Número de cuenta y PIN son obligatorios');
    err.status = 400;
    throw err;
  }

  const cuenta = await accountModel.findByNumeroCuenta(numeroCuenta);
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }

  if (cuenta.estado !== 'ACTIVO' && cuenta.estado !== 'ACTIVA') {
    const err = new Error('Cuenta no activa');
    err.status = 403;
    throw err;
  }

  const ok = await bcrypt.compare(pin, cuenta.pin_hash);
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
    if (cuenta.estado !== 'ACTIVO' && cuenta.estado !== 'ACTIVA') {
      throw Object.assign(new Error('Cuenta no activa'), { status: 403 });
    }
    if (Number(cuenta.saldo) < cantidad) {
      throw Object.assign(new Error('Saldo insuficiente'), { status: 400 });
    }

    const saldoAnterior = Number(cuenta.saldo);
    const saldoPosterior = saldoAnterior - cantidad;

    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [saldoPosterior, cuentaId]);
    await conn.query(
      `INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, descripcion)
       VALUES (?, 'RETIRO', ?, ?, ?, ?)`,
      [cuentaId, cantidad, saldoAnterior, saldoPosterior, 'Retiro en cajero automático']
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
```

### 2. `controllers/cajeroController.js`
```js
const cajeroService = require('../services/cajeroService');

async function login(req, res) {
  try {
    const { numero_cuenta, pin } = req.body;
    const data = await cajeroService.loginCajero(numero_cuenta, pin);
    req.session.cajero = data;
    res.json({ message: 'Acceso a cajero OK', cuenta: data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function saldo(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const data = await cajeroService.getSaldo(req.session.cajero.cuentaId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function ultimosMovimientos(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const data = await cajeroService.getUltimosMovimientos(req.session.cajero.cuentaId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function retirar(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const { monto } = req.body;
    const data = await cajeroService.retirar(req.session.cajero.cuentaId, monto);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

function logout(req, res) {
  delete req.session.cajero;
  res.json({ message: 'Sesión de cajero cerrada' });
}

module.exports = { login, saldo, ultimosMovimientos, retirar, logout };
```

### 3. `routes/cajeroRoutes.js`
```js
const express = require('express');
const cajeroController = require('../controllers/cajeroController');

const router = express.Router();

router.post('/login', cajeroController.login);
router.get('/saldo', cajeroController.saldo);
router.get('/ultimos-movimientos', cajeroController.ultimosMovimientos);
router.post('/retirar', cajeroController.retirar);
router.post('/logout', cajeroController.logout);

module.exports = router;
```

### 4. En `app.js` agregar:
```js
const cajeroRoutes = require('./routes/cajeroRoutes');
app.use('/api/cajero', cajeroRoutes);
```

## Criterio de aceptación
- Retiro exitoso disminuye saldo y registra movimiento
- Si falla, hay ROLLBACK completo (transacción SQL)
