-- Crear base de datos (ejecutar como superusuario)
CREATE DATABASE pelucan_spa
    WITH ENCODING = 'UTF8';

-- Conectarse a pelucan_spa y ejecutar:

-- Tabla de dueños
CREATE TABLE owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mascotas
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) DEFAULT 'Perro',
    breed VARCHAR(100),
    owner_id INTEGER NOT NULL REFERENCES owners(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    service VARCHAR(255) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    weight_kg NUMERIC(10,2),
    temperature_c NUMERIC(10,1),
    diagnosis TEXT,
    prescribed_medication TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (autenticación y roles)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales (Rex y Luna)
INSERT INTO owners (name, phone) VALUES ('Juan Pérez', '555-0101'), ('Maria García', '555-0102');
INSERT INTO pets (name, owner_id) SELECT 'Rex', id FROM owners WHERE name = 'Juan Pérez' LIMIT 1;
INSERT INTO pets (name, owner_id) SELECT 'Luna', id FROM owners WHERE name = 'Maria García' LIMIT 1;
INSERT INTO appointments (pet_id, service, appointment_date)
SELECT p.id, s.svc, s.dt FROM pets p
CROSS JOIN (VALUES 
    ('Rex','Corte de Pelo','2026-02-25 10:00'::timestamp),
    ('Luna','Baño y Limpieza','2026-02-25 11:30'::timestamp)
) AS s(nombre, svc, dt) WHERE p.name = s.nombre;

-- Nota: Los usuarios iniciales (veterinario/recepción) se insertan
-- automáticamente al arrancar la aplicación desde src/config/db.js.
