const mysql = require('mysql2');

const pool = mysql.createPool(process.env.MYSQL_URL || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'banco_db',
    port: 3306
});

module.exports = pool.promise();