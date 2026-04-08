-- Esquema inicial para:
-- 1) `usuarios`: credenciales para login/register
-- 2) `historial`: registro de eventos (log) de acciones

CREATE TABLE IF NOT EXISTS usuarios (
  idusuario INT NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(45) NOT NULL,
  correo VARCHAR(45) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  oficina VARCHAR(100) NOT NULL,
  rol ENUM('integrante', 'admin', 'superAdmin') NOT NULL DEFAULT 'integrante',
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idusuario),
  UNIQUE KEY uq_usuarios_usuario (usuario),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial (
  idhistorial INT NOT NULL AUTO_INCREMENT,
  historial_date DATETIME NULL,
  historial_user VARCHAR(45) NULL,
  historial_email VARCHAR(45) NULL,
  historial_evento VARCHAR(255) NULL,
  PRIMARY KEY (idhistorial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipos (
  codigo_equipo INT NOT NULL AUTO_INCREMENT,
  equipo VARCHAR(255) NOT NULL,
  PRIMARY KEY (codigo_equipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS unidades (
  codigo_unidad INT NOT NULL AUTO_INCREMENT,
  unidad VARCHAR(255) NOT NULL,
  nombre_de_la_unidad VARCHAR(255) NOT NULL,
  ambito VARCHAR(255) NULL,
  PRIMARY KEY (codigo_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS componentes (
  codigo_componente INT NOT NULL AUTO_INCREMENT,
  codigo_equipo INT NOT NULL,
  componente VARCHAR(255) NOT NULL,
  serie VARCHAR(255) NULL,
  total DECIMAL(10,2) NULL,
  codigo_unidad INT NULL,
  ubicacion VARCHAR(255) NULL,
  estado VARCHAR(100) NULL,
  Nro_alta VARCHAR(45) NULL,
  Nro_baja VARCHAR(45) NULL,
  lugar VARCHAR(255) NULL,
  clasificacion VARCHAR(255) NULL,
  observacion VARCHAR(255) NULL,
  PRIMARY KEY (codigo_componente),
  KEY idx_componentes_codigo_equipo (codigo_equipo),
  KEY idx_componentes_codigo_unidad (codigo_unidad),
  CONSTRAINT fk_componentes_equipos
    FOREIGN KEY (codigo_equipo) REFERENCES equipos (codigo_equipo)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_componentes_unidades
    FOREIGN KEY (codigo_unidad) REFERENCES unidades (codigo_unidad)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

