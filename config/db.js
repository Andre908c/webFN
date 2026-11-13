const mysql = require('mysql2/promise');
require('dotenv').config();

// En Railway lo ideal es MYSQL_URL (la da el plugin MySQL).
function buildPoolConfig() {
  if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
    return process.env.MYSQL_URL || process.env.DATABASE_URL;
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database:
      process.env.DB_NAME ||
      process.env.MYSQLDATABASE ||
      process.env.MYSQL_DATABASE ||
      'simulador_banco',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
}

const pool = mysql.createPool(buildPoolConfig());

module.exports = pool;