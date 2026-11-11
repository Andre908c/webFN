# FASE 3 – Banca Virtual del Cliente

## Objetivo
Permitir al cliente autenticado consultar y gestionar su cuenta personal.

## Archivos a crear / modificar

### 1. `services/clienteService.js`
```js
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
    cuenta: cuenta ? {
      id: cuenta.id,
      numero_cuenta: cuenta.numero_cuenta,
      tipo: cuenta.tipo,
      estado: cuenta.estado
    } : null
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
  if (!nombre || nombre.trim().length < 2) {
    const err = new Error('Nombre inválido');
    err.status = 400;
    throw err;
  }
  const [result] = await db.query(
    'UPDATE usuarios SET nombre = ? WHERE id = ?',
    [nombre.trim(), usuarioId]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return getPerfil(usuarioId);
}

async function cambiarPassword(usuarioId, passwordActual, passwordNueva) {
  if (!passwordActual || !passwordNueva || passwordNueva.length < 6) {
    const err = new Error('Datos de contraseña inválidos (mínimo 6 caracteres)');
    err.status = 400;
    throw err;
  }
  const user = await userModel.findByEmail(
    (await userModel.findById(usuarioId)).email
  );
  const ok = await authService.verifyPassword(passwordActual, user.password_hash);
  if (!ok) {
    const err = new Error('Contraseña actual incorrecta');
    err.status = 401;
    throw err;
  }
  const hash = await authService.hashPassword(passwordNueva);
  await userModel.updatePassword(usuarioId, hash);
  return { message: 'Contraseña actualizada' };
}

module.exports = {
  getPerfil,
  getSaldo,
  getMovimientos,
  updatePerfil,
  cambiarPassword
};
```

### 2. `controllers/clienteController.js`
```js
const clienteService = require('../services/clienteService');

async function perfil(req, res) {
  try {
    const data = await clienteService.getPerfil(req.session.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function saldo(req, res) {
  try {
    const data = await clienteService.getSaldo(req.session.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function movimientos(req, res) {
  try {
    const limit = req.query.limit || 20;
    const data = await clienteService.getMovimientos(req.session.user.id, limit);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const data = await clienteService.updatePerfil(req.session.user.id, req.body);
    // Actualizar sesión
    req.session.user.nombre = data.nombre;
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const data = await clienteService.cambiarPassword(
      req.session.user.id,
      passwordActual,
      passwordNueva
    );
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  perfil,
  saldo,
  movimientos,
  actualizarPerfil,
  cambiarPassword
};
```

### 3. `routes/clienteRoutes.js`
```js
const express = require('express');
const clienteController = require('../controllers/clienteController');
const { requireAuth, requireRole, requireActiveAccount } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('CLIENTE'), requireActiveAccount);

router.get('/perfil', clienteController.perfil);
router.get('/saldo', clienteController.saldo);
router.get('/movimientos', clienteController.movimientos);
router.put('/perfil', clienteController.actualizarPerfil);
router.put('/cambiar-password', clienteController.cambiarPassword);

module.exports = router;
```

### 4. En `app.js` agregar:
```js
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/api/cliente', clienteRoutes);
```

## Criterio de aceptación
- El cliente solo ve su propia información
- No puede modificar saldo, número de cuenta ni rol por la API
