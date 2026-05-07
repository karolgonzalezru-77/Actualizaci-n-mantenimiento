# Migración: Tabla única "Citas" → Esquema normalizado

## Contexto

**Problema:** El sistema guardaba todo en una sola tabla "Citas" (o `appointments`) con columnas repetidas en cada registro:
- `pet_name`, `owner_name` se duplicaban en cada cita
- Insostenible para una clínica real

**Misión:** Crear tablas independientes para Owners, Pets y Appointments.

**Reto:** Migrar los registros de "Rex" y "Luna" sin que la aplicación deje de funcionar.

## Contenido de esta carpeta

| Archivo       | Descripción                                      |
|---------------|--------------------------------------------------|
| `migration.sql` | Script SQL de migración                         |
| `db.js`         | Módulo de base de datos (copiar a `src/config/db.js`) |
| `.env.example`  | Ejemplo de variables de entorno                 |
| `schema.sql`    | Crear base de datos y tablas (instalación nueva) |

## Cómo ejecutar la migración

**Importante:** Ejecuta `migration.sql` solo cuando tengas la tabla antigua (con `pet_name`, `owner_name`). Para instalación nueva, usa `schema.sql` o deja que `db.js` cree todo al iniciar la app.

1. Conectarte a PostgreSQL (psql o pgAdmin) en la base de datos `pelucan_spa`.
2. Ejecutar: `psql -U postgres -d pelucan_spa -f migration.sql`
3. Copiar `.env.example` a `.env` en el proyecto y ajustar credenciales.

## Resultado

- **owners**: Dueños únicos
- **pets**: Mascotas vinculadas a `owner_id`
- **appointments**: Citas con `pet_id` (sin duplicar dueño/mascota)
