# FASE 7 – Documentación, Pruebas Integradas y Cierre

## Objetivo
Dejar el proyecto listo para demostración y despliegue.

## Checklist de cierre

### 1. README.md final
Debe incluir:
- Requisitos (Node ≥ 18, MySQL 8+)
- Pasos de instalación
- Cómo crear `.env`
- Cómo importar `database.sql`
- Cómo iniciar (`npm start` / `npm run dev`)
- Tabla de usuarios de prueba
- Endpoints principales
- Notas de despliegue (Railway / Hostinger)

### 2. Verificar `.gitignore`
```
node_modules/
.env
*.log
.DS_Store
```

### 3. Flujo integrador a probar
1. Login como cliente (`ana@banco.test` / `password`)
2. Consultar saldo y movimientos
3. Login en cajero con número de cuenta + PIN
4. Realizar un retiro
5. Volver a banca virtual y verificar que el saldo bajó
6. Login como admin
7. Ver dashboard y consignar a una cuenta
8. Verificar que el cliente ve el nuevo movimiento

### 4. Usuarios de prueba
| Rol | Email | Password | Cuenta | PIN |
|-----|-------|----------|--------|-----|
| ADMIN | admin@banco.test | password | — | — |
| CLIENTE | ana@banco.test | password | 1000000000000001 | password |
| CLIENTE | luis@banco.test | password | 1000000000000002 | password |
| CLIENTE | sofia@banco.test | password | 1000000000000003 | password |

### 5. Estructura final esperada
```
simulador-bancario/
├── config/db.js
├── models/
├── services/
├── controllers/
├── routes/
├── middleware/
├── public/
│   ├── cliente/
│   ├── cajero/
│   ├── admin/
│   ├── css/
│   └── js/
├── test/
├── .env.example
├── .gitignore
├── app.js
├── database.sql
├── package.json
└── README.md
```

### 6. Frontend (opcional en esta fase)
Si aún no hay UI, se puede entregar solo API funcional y documentar que el frontend se consume desde `public/`.

## Criterio de aceptación
- Proyecto arranca sin errores
- Flujo completo Cliente → Cajero → Admin funciona
- Listo para demo y despliegue local / Railway
