-- Script de inicialización de PostgreSQL para Associated
-- Se ejecuta automáticamente al crear el contenedor por primera vez

-- Crear la base de datos principal si no existe (ya la crea POSTGRES_DB, pero aseguramos extensiones)
-- Las extensiones se habilitan en la DB por defecto (associated_main)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
