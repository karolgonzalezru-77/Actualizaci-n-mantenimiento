# Migración: Tabla única "Citas" → Esquema normalizado

## Contexto

**Problema:** El sistema guardaba todo en una sola tabla "Citas" (o `appointments`) con columnas repetidas en cada registro:
- `pet_name`, `owner_name` se duplicaban en cada cita
- Insostenible para una clínica real

**Misión:** Crear tablas independientes para Owners, Pets y Appointments.

**Reto:** Migrar los registros de "Rex" y "Luna" sin que la aplicación deje de funcionar.

## Entregables

| Archivo | Descripción |
|---------|-------------|
| `scripts/migration.sql` | Script SQL de migración |
| `src/config/db.js` | Módulo de base de datos actualizado (PostgreSQL) |

## Cómo ejecutar la migración

**Importante:** Ejecuta el script solo cuando tengas la tabla antigua (con `pet_name`, `owner_name`). Para una instalación nueva, `db.js` crea todo automáticamente.

1. Conectarte a PostgreSQL (psql o pgAdmin) en la base de datos `pelucan_spa`.

2. Ejecutar el script:
   ```bash
   psql -U postgres -d pelucan_spa -f scripts/migration.sql
   ```
   O copiar y pegar el contenido de `scripts/migration.sql` en pgAdmin.

3. Si la tabla antigua tenía otro nombre, adapta el script (por defecto busca `appointments` o `citas` con columnas `pet_name`, `owner_name`).

## Resultado

- **owners**: Dueños únicos
- **pets**: Mascotas vinculadas a `owner_id`
- **appointments**: Citas con `pet_id` (sin duplicar dueño/mascota)

Rex y Luna quedan migrados correctamente y la aplicación sigue funcionando.
