# FASE 1 y FASE 2 – Ya completadas

## FASE 1 – Configuración Base
- `package.json` con dependencias
- `app.js` servidor Express + sesiones + `/health`
- `config/db.js` pool MySQL
- `database.sql` esquema + datos de prueba
- `.env.example`, `.gitignore`, `README.md`
- `test/health.test.js`

## FASE 2 – Autenticación (ya implementada en el proyecto)
- `models/userModel.js`
- `models/accountModel.js`
- `services/authService.js`
- `controllers/authController.js`
- `routes/authRoutes.js`
- `middleware/authMiddleware.js`
- Rutas:
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - GET  `/api/auth/me`

## Estado actual del proyecto
Ubicación: `/home/workdir/artifacts/simulador-bancario/`

Listo para continuar con FASE 3.
