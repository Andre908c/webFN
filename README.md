# Simulador Bancario Web

Aplicación full-stack de simulación bancaria con **Node.js**, **Express**, **MySQL** y frontend estático (HTML/CSS/JS + Bootstrap 5).

## Requisitos

- Node.js ≥ 18
- MySQL 8 o MariaDB equivalente

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Edita .env con tus credenciales de MySQL

# 3. Crear base de datos y datos de prueba
mysql -u root -p < database.sql

# 4. Iniciar
npm start
# o en desarrollo:
npm run dev
```

Servidor: `http://localhost:3000`  
Health: `http://localhost:3000/health`

## Usuarios de prueba

Contraseña y PIN de todos: **`password`**

| Rol     | Email              | Cuenta             |
|---------|--------------------|--------------------|
| ADMIN   | admin@banco.test   | —                  |
| CLIENTE | ana@banco.test     | 1000000000000001   |
| CLIENTE | luis@banco.test    | 1000000000000002   |
| CLIENTE | sofia@banco.test   | 1000000000000003   |

## API principal

### Auth
- `POST /api/auth/login` `{ "email", "password" }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Cliente (sesión CLIENTE)
- `GET  /api/cliente/perfil`
- `GET  /api/cliente/saldo`
- `GET  /api/cliente/movimientos`
- `PUT  /api/cliente/perfil`
- `PUT  /api/cliente/cambiar-password`
- `POST /api/cliente/transferir` `{ "numero_cuenta_destino", "monto", "descripcion?" }`

### Cajero
- `POST /api/cajero/login` `{ "numero_cuenta", "pin" }`
- `GET  /api/cajero/saldo`
- `GET  /api/cajero/ultimos-movimientos`
- `POST /api/cajero/retirar` `{ "monto" }`
- `POST /api/cajero/logout`

### Admin (sesión ADMIN)
- `GET   /api/admin/dashboard`
- `GET   /api/admin/clientes?q=`
- `POST  /api/admin/clientes`
- `PATCH /api/admin/clientes/:id/estado` `{ "estado": "ACTIVO|INACTIVO|BLOQUEADO" }`
- `POST  /api/admin/consignaciones` `{ "numero_cuenta", "monto", "descripcion?" }`
- `GET   /api/admin/movimientos`

## Flujo de demostración sugerido

1. Login cliente → consultar saldo y movimientos
2. Cajero → login con cuenta + PIN → retiro
3. Volver a banca virtual → verificar saldo actualizado
4. Login admin → dashboard → consignación
5. Cliente ve el nuevo movimiento

## Estructura

```
simulador-bancario/
├── config/db.js
├── models/
├── services/
├── controllers/
├── routes/
├── middleware/
├── public/
├── test/
├── app.js
├── database.sql
├── package.json
├── .env.example
└── README.md
```

## Despliegue

Compatible con Railway, Render o Hostinger (Node.js + MySQL).
Configura las variables de `.env` en el panel del proveedor y apunta el comando de inicio a `npm start`.
