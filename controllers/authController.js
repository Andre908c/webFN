const pool = require('../config/db'); // O la ruta donde tengas tu conexión a MySQL
const bcrypt = require('bcrypt');

async function login(email, password) {
  // 1. Buscar el usuario por email
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE email = ?', 
    [email]
  );

  if (rows.length === 0) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const user = rows[0];

  // 2. Verificar estado activo
  if (user.estado && user.estado !== 'activo') {
    const error = new Error('Usuario inactivo o suspendido');
    error.status = 403;
    throw error;
  }

  // 3. Validar contraseña (soporta tanto texto plano como hash de bcrypt por seguridad)
  let isValidPassword = false;
  
  if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
    isValidPassword = await bcrypt.compare(password, user.password_hash);
  } else {
    // Si por alguna razón quedó en texto plano en la BD
    isValidPassword = (password === user.password_hash);
  }

  if (!isValidPassword) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  // 4. Buscar la cuenta bancaria asociada al usuario
  const [cuentasRows] = await pool.query(
    'SELECT numero_cuenta FROM cuentas WHERE usuario_id = ? LIMIT 1',
    [user.id]
  );

  user.cuenta = cuentasRows.length > 0 ? cuentasRows[0].numero_cuenta : null;

  return user;
}

module.exports = {
  login
};