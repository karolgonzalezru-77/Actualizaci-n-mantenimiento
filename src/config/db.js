/**
 * Base de datos SQLite - Esquema normalizado (En memoria)
 * Tablas: owners, pets, appointments, users
 */
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
        return false;
    }
    const [salt, key] = storedHash.split(':');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
    } catch {
        return false;
    }
}

// Inicializar base de datos en memoria
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos en memoria:', err.message);
    } else {
        console.log('Conectada la base de datos SQLite en memoria.');
        initDb();
    }
});

// Exponer helpers para que el login use la misma lógica
db.hashPassword = hashPassword;
db.verifyPassword = verifyPassword;

// Crear tablas e insertar datos iniciales
function initDb() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS owners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                species TEXT DEFAULT 'Perro',
                breed TEXT,
                owner_id INTEGER NOT NULL REFERENCES owners(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL REFERENCES pets(id),
                service TEXT NOT NULL,
                appointment_date DATETIME NOT NULL,
                status TEXT DEFAULT 'Scheduled',
                weight_kg NUMERIC,
                temperature_c NUMERIC,
                diagnosis TEXT,
                prescription TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar usuarios de prueba
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare('INSERT INTO users (username, full_name, role, password_hash) VALUES (?, ?, ?, ?)');
                stmt.run('vetadmin', 'Dra. Veterinaria', 'Veterinario', hashPassword('Vet@1234'));
                stmt.run('recepcion', 'Recepción Principal', 'Recepcionista', hashPassword('Recep@1234'));
                stmt.finalize();
            }
        });

        // Insertar datos de prueba iniciales (dueños, mascotas, citas)
        db.get('SELECT COUNT(*) as count FROM owners', (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO owners (name, phone) VALUES (?, ?)", ['Juan Pérez', '555-0101'], function(err) {
                    if (err) return;
                    const owner1Id = this.lastID;
                    db.run("INSERT INTO pets (name, owner_id) VALUES (?, ?)", ['Rex', owner1Id], function(err) {
                        if (err) return;
                        const rexId = this.lastID;
                        db.run("INSERT INTO appointments (pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescription) VALUES (?, ?, ?, ?, ?, ?, ?)", [rexId, 'Consulta Médica', '2026-02-25 10:00', 15.2, 38.5, 'Otitis leve', 'Gotas óticas por 5 días']);
                    });
                });

                db.run("INSERT INTO owners (name, phone) VALUES (?, ?)", ['Maria García', '555-0102'], function(err) {
                    if (err) return;
                    const owner2Id = this.lastID;
                    db.run("INSERT INTO pets (name, owner_id) VALUES (?, ?)", ['Luna', owner2Id], function(err) {
                        if (err) return;
                        const lunaId = this.lastID;
                        db.run("INSERT INTO appointments (pet_id, service, appointment_date) VALUES (?, ?, ?)", [lunaId, 'Baño y Limpieza', '2026-02-25 11:30']);
                    });
                });
            }
        });
    });
}

module.exports = db;
