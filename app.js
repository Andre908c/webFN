const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway / proxy: necesario para cookies secure
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'banco_default_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de autenticación
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Rutas de banca virtual del cliente
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/api/cliente', clienteRoutes);

// Rutas de cajero automático
const cajeroRoutes = require('./routes/cajeroRoutes');
app.use('/api/cajero', cajeroRoutes);

// Rutas de administración
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Endpoint de salud y verificación de conexión a la base de datos
app.get('/health', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 + 1 AS result, NOW() AS server_time');
    res.json({
      status: 'ok',
      service: 'simulador-bancario',
      database: 'connected',
      db_check: result[0]
    });
  } catch (error) {
    console.error('Error de conexión a la base de datos:', error.message);
    res.status(500).json({
      status: 'error',
      service: 'simulador-bancario',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Ruta raíz → login
app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

// Iniciar servidor solo si no estamos en testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`[Simulador Bancario] Servidor corriendo en http://localhost:${PORT}`);
    try {
      await db.query('SELECT 1');
      console.log('[Simulador Bancario] Conexión a MySQL exitosa');
    } catch (err) {
      console.error('[Simulador Bancario] Error al conectar a MySQL:', err.message);
    }
  });
}

module.exports = app;

const pool = require('./config/db');

async function inicializarBaseDeDatos() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                correo VARCHAR(255) NOT NULL UNIQUE,
                contrasena VARCHAR(255) NOT NULL,
                nombre VARCHAR(255),
                rol VARCHAR(50) DEFAULT 'cliente'
            );
        `);

        await connection.query(`
            INSERT IGNORE INTO usuarios (id, correo, contrasena, nombre, rol) 
            VALUES (1, 'admin@banco.test', '123456', 'Administrador', 'admin');
        `);

        connection.release();
        console.log("Tablas y datos iniciales creados correctamente.");
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
    }
}

inicializarBaseDeDatos();