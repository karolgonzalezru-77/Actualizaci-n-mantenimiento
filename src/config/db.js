/**
 * Base de datos SQL.js - Esquema normalizado (100% puro JavaScript en memoria)
 * Tablas: owners, pets, appointments, users
 */
require('dotenv').config();
const initSqlJs = require('sql.js');
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

let dbInstance = null;
let isReady = false;
const queue = [];

function executeWhenReady(fn) {
    if (isReady) fn();
    else queue.push(fn);
}

// Interfaz compatible con los controladores
const db = {
    all(sql, params, callback) {
        executeWhenReady(() => {
            try {
                const stmt = dbInstance.prepare(sql);
                if (params && params.length > 0) stmt.bind(params);
                const results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                if (callback) callback(null, results);
            } catch (err) {
                if (callback) callback(err, []);
            }
        });
    },
    get(sql, params, callback) {
        executeWhenReady(() => {
            try {
                const stmt = dbInstance.prepare(sql);
                if (params && params.length > 0) stmt.bind(params);
                let result = null;
                if (stmt.step()) {
                    result = stmt.getAsObject();
                }
                stmt.free();
                if (callback) callback(null, result);
            } catch (err) {
                if (callback) callback(err, null);
            }
        });
    },
    run(sql, params, callback) {
        executeWhenReady(() => {
            try {
                dbInstance.run(sql, params);
                let lastID = null;
                if (sql.trim().toUpperCase().startsWith('INSERT')) {
                    const res = dbInstance.exec("SELECT last_insert_rowid()")[0];
                    if (res && res.values && res.values.length > 0) {
                        lastID = res.values[0][0];
                    }
                }
                const ctx = { lastID };
                if (callback) callback.call(ctx, null);
            } catch (err) {
                if (callback) callback.call({lastID: null}, err);
            }
        });
    },
    hashPassword,
    verifyPassword
};

// Inicializar sql.js
initSqlJs().then((SQL) => {
    dbInstance = new SQL.Database();
    initDb();
    isReady = true;
    console.log('Base de datos sql.js (100% JS) iniciada correctamente.');
    while(queue.length > 0) {
        queue.shift()();
    }
}).catch(err => {
    console.error("Error inicializando sql.js:", err);
});

function initDb() {
    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS owners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            species TEXT DEFAULT 'Perro',
            breed TEXT,
            owner_id INTEGER NOT NULL REFERENCES owners(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    dbInstance.run(`
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
    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    let usersCount = 0;
    const resUsers = dbInstance.exec('SELECT COUNT(*) as count FROM users');
    if (resUsers.length > 0) usersCount = resUsers[0].values[0][0];

    if (usersCount === 0) {
        dbInstance.run('INSERT INTO users (username, full_name, role, password_hash) VALUES (?, ?, ?, ?)', 
            ['vetadmin', 'Dra. Veterinaria', 'Veterinario', hashPassword('Vet@1234')]);
        dbInstance.run('INSERT INTO users (username, full_name, role, password_hash) VALUES (?, ?, ?, ?)', 
            ['recepcion', 'Recepción Principal', 'Recepcionista', hashPassword('Recep@1234')]);
    }

    let ownersCount = 0;
    const resOwners = dbInstance.exec('SELECT COUNT(*) as count FROM owners');
    if (resOwners.length > 0) ownersCount = resOwners[0].values[0][0];

    if (ownersCount === 0) {
        dbInstance.run("INSERT INTO owners (name, phone) VALUES (?, ?)", ['Juan Pérez', '555-0101']);
        let owner1Id = dbInstance.exec("SELECT last_insert_rowid()")[0].values[0][0];

        dbInstance.run("INSERT INTO pets (name, owner_id) VALUES (?, ?)", ['Rex', owner1Id]);
        let rexId = dbInstance.exec("SELECT last_insert_rowid()")[0].values[0][0];

        dbInstance.run("INSERT INTO appointments (pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescription) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [rexId, 'Consulta Médica', '2026-02-25 10:00', 15.2, 38.5, 'Otitis leve', 'Gotas óticas por 5 días']);

        dbInstance.run("INSERT INTO owners (name, phone) VALUES (?, ?)", ['Maria García', '555-0102']);
        let owner2Id = dbInstance.exec("SELECT last_insert_rowid()")[0].values[0][0];

        dbInstance.run("INSERT INTO pets (name, owner_id) VALUES (?, ?)", ['Luna', owner2Id]);
        let lunaId = dbInstance.exec("SELECT last_insert_rowid()")[0].values[0][0];

        dbInstance.run("INSERT INTO appointments (pet_id, service, appointment_date) VALUES (?, ?, ?)", 
            [lunaId, 'Baño y Limpieza', '2026-02-25 11:30']);
    }
}

module.exports = db;
