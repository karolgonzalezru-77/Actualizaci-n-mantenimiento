/**
 * Base de datos PostgreSQL - Esquema normalizado
 * Tablas: owners, pets, appointments (ver migration.sql)
 * Usar en: src/config/db.js del proyecto
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'pelucan_spa',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Convierte placeholders ? a $1, $2, ...
function convertPlaceholders(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
}

// API compatible con sqlite3 para no modificar controladores
const db = {
    all(sql, params, callback) {
        const q = convertPlaceholders(sql);
        pool.query(q, params || [], (err, res) => {
            if (callback) callback(err, err ? null : (res?.rows || []));
        });
    },
    get(sql, params, callback) {
        const q = convertPlaceholders(sql);
        pool.query(q, params || [], (err, res) => {
            if (callback) callback(err, err ? null : (res?.rows?.[0] || null));
        });
    },
    run(sql, params, callback) {
        const q = convertPlaceholders(sql);
        const arr = Array.isArray(params) ? params : (params != null ? [params] : []);
        pool.query(q, arr, (err, res) => {
            const ctx = { lastID: res?.rows?.[0]?.id ?? null };
            if (callback) callback.call(ctx, err);
        });
    },
};

// Crear tablas e insertar datos iniciales (solo si no existen)
async function initDb() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS owners (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS pets (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                species VARCHAR(100) DEFAULT 'Perro',
                breed VARCHAR(100),
                owner_id INTEGER NOT NULL REFERENCES owners(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                pet_id INTEGER NOT NULL REFERENCES pets(id),
                service VARCHAR(255) NOT NULL,
                appointment_date TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'Scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        const count = await client.query('SELECT COUNT(*) FROM owners');
        if (parseInt(count.rows[0].count, 10) === 0) {
            const r1 = await client.query("INSERT INTO owners (name, phone) VALUES ('Juan Pérez', '555-0101') RETURNING id");
            const r2 = await client.query("INSERT INTO owners (name, phone) VALUES ('Maria García', '555-0102') RETURNING id");
            const rex = await client.query('INSERT INTO pets (name, owner_id) VALUES ($1, $2) RETURNING id', ['Rex', r1.rows[0].id]);
            const luna = await client.query('INSERT INTO pets (name, owner_id) VALUES ($1, $2) RETURNING id', ['Luna', r2.rows[0].id]);
            await client.query('INSERT INTO appointments (pet_id, service, appointment_date) VALUES ($1, $2, $3)', [rex.rows[0].id, 'Corte de Pelo', '2026-02-25 10:00']);
            await client.query('INSERT INTO appointments (pet_id, service, appointment_date) VALUES ($1, $2, $3)', [luna.rows[0].id, 'Baño y Limpieza', '2026-02-25 11:30']);
        }
    } finally {
        client.release();
    }
}

initDb().catch((err) => console.error('Error iniciando base de datos:', err));

module.exports = db;
