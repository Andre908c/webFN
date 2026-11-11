require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./config/db');

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8 // 8 horas
  }
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'simulador-bancario-web' });
});

// Las rutas de API se agregarán en fases posteriores
// app.use('/api/auth', authRoutes);
// app.use('/api/cliente', clienteRoutes);
// app.use('/api/cajero', cajeroRoutes);
// app.use('/api/admin', adminRoutes);

const server = app.listen(port, () => {
  console.log(`Servidor disponible en http://localhost:${port}`);

  db.query('SELECT 1')
    .then(() => console.log('Conexión a MySQL establecida.'))
    .catch((error) => {
      console.error(`No se pudo conectar a MySQL: ${error.message}`);
      console.error('Verifica las variables del archivo .env y ejecuta database.sql.');
    });
});

function shutdown() {
  server.close(() => {
    db.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);