-- Script de inicialización de PostgreSQL para el proyecto Associated
-- Se ejecuta una sola vez al crear el contenedor

-- Habilitar extensiones en la base de datos por defecto (postgres)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear la base de datos principal del sistema
CREATE DATABASE associated_main;

-- Conectar a la nueva base de datos y habilitar las extensiones
\connect associated_main

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
