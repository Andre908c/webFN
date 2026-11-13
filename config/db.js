const mysql = require('mysql2');

// Node.js lee automáticamente la MYSQL_URL que guardaste en el panel de Railway
const connectionConfig = process.env.MYSQL_URL || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'banco_db',
    port: 3306
};

const pool = mysql.createPool(connectionConfig);

module.exports = pool.promise();