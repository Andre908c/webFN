const mysql = require('mysql2');

const pool = mysql.createPool(process.env.MYSQL_URL || {
    host: process.env.MYSQLHOST || '${{MySQL.MYSQL_URL}}',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'PASSWORD',
    database: process.env.MYSQL_DATABASE || 'banco_db',
    port: process.env.MYSQLPORT || 3306
});

module.exports = pool.promise();