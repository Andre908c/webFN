const mysql = require('mysql2');

// Si existe MYSQL_URL en el entorno (Railway), se conecta usando esa URL completa de forma nativa.
// Si no existe (estás en tu PC local), usa el objeto con los datos de desarrollo.
const pool = mysql.createPool(process.env.MYSQL_URL || {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'banco_db',
    port: process.env.MYSQLPORT || 3306
});

module.exports = pool.promise();