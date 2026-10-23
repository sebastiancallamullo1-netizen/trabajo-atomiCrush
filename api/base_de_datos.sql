-- ============================================================
-- BASE DE DATOS DE ATOMICRUSH (MySQL / phpMyAdmin)
-- Para crearla: phpMyAdmin > pestaña "Importar" > elegir este archivo > "Continuar".
-- ============================================================

CREATE DATABASE IF NOT EXISTS atomicrush CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE atomicrush;

-- Un registro por jugador. La contraseña NO se guarda tal cual:
-- se guarda el "hash" que genera password_hash() en PHP.
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(20) NOT NULL UNIQUE,
  contrasenia VARCHAR(255) NOT NULL,
  nivel_maximo INT NOT NULL DEFAULT 1,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de puntuaciones: el mejor puntaje y las estrellas de cada
-- jugador en cada nivel (un jugador tiene una fila por nivel ganado).
CREATE TABLE IF NOT EXISTS puntajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nivel INT NOT NULL,
  puntos INT NOT NULL DEFAULT 0,
  estrellas INT NOT NULL DEFAULT 0,
  UNIQUE (usuario_id, nivel),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Álbum: qué moléculas descubrió cada jugador (por ejemplo "H2O")
CREATE TABLE IF NOT EXISTS album (
  usuario_id INT NOT NULL,
  formula VARCHAR(10) NOT NULL,
  PRIMARY KEY (usuario_id, formula),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
