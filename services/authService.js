const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const accountModel = require('../models/accountModel');

async function login(email, password) {
  if (!email || !password) {
    const error = new Error('Email y contraseña son obligatorios');
    error.status = 400;
    throw error;
  }

  const user = await userModel.findByEmail(email.trim().toLowerCase());
  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  if (user.estado === 'BLOQUEADO') {
    const error = new Error('Cuenta bloqueada. Contacte al administrador');
    error.status = 403;
    throw error;
  }

  if (user.estado === 'INACTIVO') {
    const error = new Error('Cuenta inactiva');
    error.status = 403;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const cuenta = await accountModel.findByUsuarioId(user.id);

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

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  login,
  hashPassword,
  verifyPassword
};
