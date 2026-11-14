const mysql = require('mysql2');
const pool = mysql.createPool(process.env.MYSQL_URL || 'mysql://root:WbOQXaaQTTEdVUoBYSkhSwjevLuLZCF@mysql.railway.internal:3306/railway');
module.exports = pool.promise();