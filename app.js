const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares para parsing de requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'banco_default_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 2 // 2 horas
    }
  })
);

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

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

// Ruta raíz
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Simulador Bancario Web</title>
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 8px; }
        a { color: #38bdf8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Simulador Bancario Web</h1>
        <p>Servidor activo y listo.</p>
        <p>Consulta <a href="/health">/health</a> para el estado del sistema y la base de datos.</p>
      </div>
    </body>
    </html>
  `);
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
