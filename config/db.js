const mysql = require('mysql2');

// Usamos estrictamente MYSQL_URL si existe, evitando que las variables vacías rompan la conexión
const pool = mysql.createPool(process.env.MYSQL_URL || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'banco_db',
    port: 3306
});

module.exports = pool.promise();