const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway proporciona MYSQL_URL con todo incluido (host, puerto, usuario, contraseña y base de datos)
const pool = mysql.createPool(process.env.MYSQL_URL || {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'simulador_banco',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;