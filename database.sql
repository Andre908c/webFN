-- =====================================================
-- Simulador Bancario Web - Script de Base de Datos
-- =====================================================

CREATE DATABASE IF NOT EXISTS simulador_banco
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE simulador_banco;

-- Desactivar llaves foráneas temporalmente para inicialización limpia
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS cuentas;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
  estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Tabla: cuentas
-- -----------------------------------------------------
CREATE TABLE cuentas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_cuenta VARCHAR(20) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  saldo DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  pin_hash VARCHAR(255) NOT NULL,
  tipo ENUM('AHORROS', 'CORRIENTE') NOT NULL DEFAULT 'AHORROS',
  estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADA') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cuentas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Tabla: movimientos
-- -----------------------------------------------------
CREATE TABLE movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cuenta_id INT NOT NULL,
  tipo_movimiento ENUM('CONSIGNACION', 'RETIRO', 'TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRADA') NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  saldo_anterior DECIMAL(12, 2) NOT NULL,
  saldo_posterior DECIMAL(12, 2) NOT NULL,
  cuenta_destino_id INT NULL,
  descripcion VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE,
  CONSTRAINT fk_movimientos_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
-- Datos de Prueba Iniciales
-- Contraseña y PIN para todos los usuarios de prueba: "password"
-- Hash bcrypt de "password": $2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e
-- -----------------------------------------------------

-- Usuarios
INSERT INTO usuarios (id, nombre, email, password_hash, rol, estado) VALUES
(1, 'Administrador General', 'admin@banco.test', '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'ADMIN', 'ACTIVO'),
(2, 'Ana Gómez', 'ana@banco.test', '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'CLIENTE', 'ACTIVO'),
(3, 'Luis Martínez', 'luis@banco.test', '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'CLIENTE', 'ACTIVO'),
(4, 'Sofía Ramírez', 'sofia@banco.test', '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'CLIENTE', 'ACTIVO');

-- Cuentas asociadas a los clientes
INSERT INTO cuentas (id, numero_cuenta, usuario_id, saldo, pin_hash, tipo, estado) VALUES
(1, '1000000000000001', 2, 2500000.00, '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'AHORROS', 'ACTIVO'),
(2, '1000000000000002', 3, 1200000.00, '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'AHORROS', 'ACTIVO'),
(3, '1000000000000003', 4, 3450000.00, '$2b$10$EhQb7VMlEgN54.QJFf2HhemBTa1Jdo8XDsZ67s.YK56rgxEw3C96e', 'CORRIENTE', 'ACTIVO');

-- Movimientos de apertura / iniciales
INSERT INTO movimientos (cuenta_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, descripcion) VALUES
(1, 'CONSIGNACION', 2500000.00, 0.00, 2500000.00, 'Saldo de apertura'),
(2, 'CONSIGNACION', 1200000.00, 0.00, 1200000.00, 'Saldo de apertura'),
(3, 'CONSIGNACION', 3450000.00, 0.00, 3450000.00, 'Saldo de apertura');
