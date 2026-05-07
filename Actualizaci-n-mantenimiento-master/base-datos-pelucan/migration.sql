-- ============================================================
-- MIGRACIÓN: De tabla única "Citas" a esquema normalizado
-- ============================================================
-- Problema: El sistema guardaba todo en una sola tabla "Citas"
--   (pet_name, owner_name duplicados en cada registro).
-- Solución: Tablas independientes Owners, Pets y Appointments.
-- Reto: Migrar Rex y Luna sin que la aplicación deje de funcionar.
-- ============================================================

-- PASO 1: Renombrar tabla antigua (backup)
ALTER TABLE IF EXISTS appointments RENAME TO _citas_old;
ALTER TABLE IF EXISTS citas RENAME TO _citas_old;

-- PASO 2: Crear tablas normalizadas
CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) DEFAULT 'Perro',
    breed VARCHAR(100),
    owner_id INTEGER NOT NULL REFERENCES owners(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
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

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PASO 3: Migrar datos desde tabla antigua (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_citas_old') THEN
        -- Insertar dueños únicos
        INSERT INTO owners (name)
        SELECT DISTINCT owner_name FROM _citas_old
        WHERE owner_name IS NOT NULL AND owner_name != '';

        -- Insertar mascotas (Rex, Luna, etc.) vinculadas a sus dueños
        INSERT INTO pets (name, owner_id)
        SELECT DISTINCT ON (c.pet_name, c.owner_name) c.pet_name, o.id
        FROM _citas_old c
        JOIN owners o ON o.name = c.owner_name
        WHERE c.pet_name IS NOT NULL AND c.pet_name != '';

        -- Migrar citas con referencia a pet_id
        INSERT INTO appointments (pet_id, service, appointment_date, status)
        SELECT p.id, c.service, c.appointment_date, COALESCE(c.status, 'Scheduled')
        FROM _citas_old c
        JOIN owners o ON o.name = c.owner_name
        JOIN pets p ON p.owner_id = o.id AND p.name = c.pet_name;

        RAISE NOTICE 'Migración completada. Verifica los datos.';
    ELSE
        -- No hay tabla antigua: insertar datos iniciales (Rex y Luna)
        INSERT INTO owners (name, phone) VALUES ('Juan Pérez', '555-0101'), ('Maria García', '555-0102');
        INSERT INTO pets (name, owner_id) 
        SELECT 'Rex', id FROM owners WHERE name = 'Juan Pérez' LIMIT 1
        UNION ALL
        SELECT 'Luna', id FROM owners WHERE name = 'Maria García' LIMIT 1;
        INSERT INTO appointments (pet_id, service, appointment_date)
        SELECT p.id, s.svc, s.dt FROM pets p
        CROSS JOIN (VALUES 
            ('Rex','Corte de Pelo','2026-02-25 10:00'::timestamp),
            ('Luna','Baño y Limpieza','2026-02-25 11:30'::timestamp)
        ) AS s(nombre, svc, dt)
        WHERE p.name = s.nombre;
        RAISE NOTICE 'Datos iniciales insertados (Rex y Luna).';
    END IF;
END $$;

-- PASO 4 (opcional): Eliminar tabla antigua cuando confirmes que todo funciona
-- DROP TABLE IF EXISTS _citas_old;

-- Nota: Los usuarios iniciales (veterinario/recepción) se crean
-- automáticamente por la aplicación al iniciar.
