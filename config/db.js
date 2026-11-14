const mysql = require('mysql2');

// Construimos la URL de conexión usando las variables que sí están llenas en Railway
const dbHost = process.env.MYSQLHOST || 'localhost';
const dbUser = process.env.MYSQLUSER || 'root';
const dbPassword = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const dbName = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway';
const dbPort = process.env.MYSQLPORT || 3306;

// Forzamos el uso de la IP v4 (127.0.0.1) si es local para evitar el fallo de IPv6 (::1)
const resolvedHost = dbHost === 'localhost' ? '127.0.0.1' : dbHost;

const pool = mysql.createPool({
    host: resolvedHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: Number(dbPort),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();