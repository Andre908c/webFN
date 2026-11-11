# FASE 6 – Módulo Administrativo

## Objetivo
Panel de administración: métricas, clientes, estados, consignaciones, movimientos.

## Archivos a crear

### 1. `services/adminService.js`
```js
const db = require('../config/db');
const bcrypt = require('bcrypt');

async function getDashboard() {
  const [[clientes]] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(estado = 'ACTIVO') AS activos,
       SUM(estado = 'BLOQUEADO') AS bloqueados,
       SUM(estado = 'INACTIVO') AS inactivos
     FROM usuarios WHERE rol = 'CLIENTE'`
  );
  const [[saldo]] = await db.query('SELECT COALESCE(SUM(saldo),0) AS saldo_total FROM cuentas');
  return {
    total_clientes: Number(clientes.total),
    activos: Number(clientes.activos),
    bloqueados: Number(clientes.bloqueados),
    inactivos: Number(clientes.inactivos),
    saldo_total: Number(saldo.saldo_total)
  };
}

async function listarClientes(q = '') {
  const like = `%${q}%`;
  const [rows] = await db.query(
    `SELECT u.id, u.nombre, u.email, u.estado, u.created_at,
            c.numero_cuenta, c.saldo, c.tipo, c.estado AS estado_cuenta
     FROM usuarios u
     LEFT JOIN cuentas c ON c.usuario_id = u.id
     WHERE u.rol = 'CLIENTE'
       AND (u.nombre LIKE ? OR u.email LIKE ? OR c.numero_cuenta LIKE ?)
     ORDER BY u.id`,
    [like, like, like]
  );
  return rows;
}

async function crearCliente({ nombre, email, password, numero_cuenta, saldo_inicial = 0, pin = 'password' }) {
  if (!nombre || !email || !password || !numero_cuenta) {
    const err = new Error('Datos incompletos');
    err.status = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const pinHash = await bcrypt.hash(pin, 10);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [userResult] = await conn.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES (?, ?, ?, 'CLIENTE', 'ACTIVO')`,
      [nombre, email.toLowerCase(), passwordHash]
    );
    const usuarioId = userResult.insertId;
    await conn.query(
      `INSERT INTO cuentas (numero_cuenta, usuario_id, saldo, pin_hash, tipo, estado)
       VALUES (?, ?, ?, ?, 'AHORROS', 'ACTIVO')`,
      [numero_cuenta, usuarioId, Number(saldo_inicial) || 0, pinHash]
    );
    if (Number(saldo_inicial) > 0) {
      const [c] = await conn.query('SELECT id FROM cuentas WHERE usuario_id = ?', [usuarioId]);
      await conn.query(
        `INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, descripcion)
         VALUES (?, 'CONSIGNACION', ?, 0, ?, 'Saldo inicial')`,
        [c[0].id, Number(saldo_inicial), Number(saldo_inicial)]
      );
    }
    await conn.commit();
    return { id: usuarioId, nombre, email, numero_cuenta };
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw Object.assign(new Error('Email o número de cuenta ya existe'), { status: 409 });
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function cambiarEstadoCliente(id, estado) {
  const permitidos = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'];
  if (!permitidos.includes(estado)) {
    const err = new Error('Estado inválido');
    err.status = 400;
    throw err;
  }
  const [result] = await db.query(
    `UPDATE usuarios SET estado = ? WHERE id = ? AND rol = 'CLIENTE'`,
    [estado, id]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  return { id, estado };
}

async function consignar(numeroCuenta, monto, descripcion = 'Consignación administrativa') {
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
      'SELECT id, saldo, estado FROM cuentas WHERE numero_cuenta = ? FOR UPDATE',
      [numeroCuenta]
    );
    const cuenta = rows[0];
    if (!cuenta) throw Object.assign(new Error('Cuenta no encontrada'), { status: 404 });

    const saldoAnt = Number(cuenta.saldo);
    const saldoPost = saldoAnt + cantidad;

    await conn.query('UPDATE cuentas SET saldo = ? WHERE id = ?', [saldoPost, cuenta.id]);
    await conn.query(
      `INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, descripcion)
       VALUES (?, 'CONSIGNACION', ?, ?, ?, ?)`,
      [cuenta.id, cantidad, saldoAnt, saldoPost, descripcion]
    );
    await conn.commit();
    return { numero_cuenta: numeroCuenta, monto: cantidad, saldo_nuevo: saldoPost };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listarMovimientos(limit = 50) {
  const [rows] = await db.query(
    `SELECT m.id, m.tipo_movimiento AS tipo, m.monto, m.descripcion, m.created_at,
            c.numero_cuenta
     FROM movimientos m
     JOIN cuentas c ON c.id = m.cuenta_id
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

module.exports = {
  getDashboard,
  listarClientes,
  crearCliente,
  cambiarEstadoCliente,
  consignar,
  listarMovimientos
};
```

### 2. `controllers/adminController.js`
```js
const adminService = require('../services/adminService');

async function dashboard(req, res) {
  try {
    res.json(await adminService.getDashboard());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarClientes(req, res) {
  try {
    res.json(await adminService.listarClientes(req.query.q || ''));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crearCliente(req, res) {
  try {
    const data = await adminService.crearCliente(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function cambiarEstado(req, res) {
  try {
    const data = await adminService.cambiarEstadoCliente(req.params.id, req.body.estado);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function consignar(req, res) {
  try {
    const { numero_cuenta, monto, descripcion } = req.body;
    const data = await adminService.consignar(numero_cuenta, monto, descripcion);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function movimientos(req, res) {
  try {
    res.json(await adminService.listarMovimientos(req.query.limit || 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  dashboard,
  listarClientes,
  crearCliente,
  cambiarEstado,
  consignar,
  movimientos
};
```

### 3. `routes/adminRoutes.js`
```js
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/clientes', adminController.listarClientes);
router.post('/clientes', adminController.crearCliente);
router.patch('/clientes/:id/estado', adminController.cambiarEstado);
router.post('/consignaciones', adminController.consignar);
router.get('/movimientos', adminController.movimientos);

module.exports = router;
```

### 4. En `app.js` agregar:
```js
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
```

## Criterio de aceptación
- Admin puede consignar, listar, crear y cambiar estados
