# Simulador Bancario Web

Simulador bancario interactivo full-stack desarrollado con **Node.js**, **Express**, **MySQL** y **Vanilla JS / Bootstrap 5**.

---

## Requisitos Previos

- Node.js ≥ 18
- MySQL / MariaDB 8+

---

## Configuración y Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y ajusta las credenciales de MySQL:
   ```bash
   cp .env.example .env
   ```

3. **Importar la base de datos:**
   ```bash
   mysql -u root -p < database.sql
   ```

4. **Iniciar el servidor:**
   ```bash
   npm start
   # O en modo desarrollo con recarga automática:
   npm run dev
   ```

5. **Verificar el estado del servidor y la base de datos:**
   Abre [http://localhost:3000/health](http://localhost:3000/health) en tu navegador o mediante curl:
   ```bash
   curl http://localhost:3000/health
   ```

---

## Usuarios de Prueba (Password y PIN: `password`)

| Rol | Nombre | Email | Cuenta | Saldo Inicial |
|---|---|---|---|---|
| ADMIN | Administrador General | `admin@banco.test` | - | - |
| CLIENTE | Ana Gómez | `ana@banco.test` | `1000000000000001` | $2,500,000.00 |
| CLIENTE | Luis Martínez | `luis@banco.test` | `1000000000000002` | $1,200,000.00 |
| CLIENTE | Sofía Ramírez | `sofia@banco.test` | `1000000000000003` | $3,450,000.00 |
