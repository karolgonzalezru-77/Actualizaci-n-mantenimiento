/**
 * Base de datos SQLite - Esquema en memoria para pruebas y Vercel
 * Tablas: owners, pets, appointments
 */
const sqlite3 = require('sqlite3').verbose();

// Usar base de datos en memoria (se reinicia al reiniciar el servidor, ideal para Vercel serverless)
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite en memoria.');
    }
});

// Crear tablas e insertar datos iniciales
function initDb() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS owners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                species VARCHAR(100) DEFAULT 'Perro',
                breed VARCHAR(100),
                owner_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES owners(id)
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                service VARCHAR(255) NOT NULL,
                appointment_date TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'Scheduled',
                weight_kg NUMERIC(10,2),
                temperature_c NUMERIC(10,1),
                diagnosis TEXT,
                prescribed_medication TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id)
            )
        `);

        // Datos iniciales si la tabla owners está vacía
        db.get('SELECT COUNT(*) AS count FROM owners', (err, row) => {
            if (row && row.count === 0) {
                // Propietarios realistas
                db.run("INSERT INTO owners (name, phone, email) VALUES ('Carlos Restrepo', '312-456-7890', 'crestrepo@gmail.com')", function() {
                    const idCarlos = this.lastID;
                    db.run("INSERT INTO owners (name, phone, email) VALUES ('Valeria Morales', '300-987-6543', 'valemora92@hotmail.com')", function() {
                        const idValeria = this.lastID;
                        db.run("INSERT INTO owners (name, phone) VALUES ('Andrea Castillo', '315-678-1234')", function() {
                            const idAndrea = this.lastID;
                            
                            // Mascotas realistas
                            db.run("INSERT INTO pets (name, species, breed, owner_id) VALUES ('Toby', 'Perro', 'Schnauzer', ?)", [idCarlos], function() {
                                const idToby = this.lastID;
                                db.run("INSERT INTO appointments (pet_id, service, appointment_date, status) VALUES (?, 'Corte de Pelo y Uñas', '2026-05-10 09:00', 'Scheduled')", [idToby]);
                                db.run("INSERT INTO appointments (pet_id, service, appointment_date, status, weight_kg, temperature_c, diagnosis, prescribed_medication) VALUES (?, 'Consulta Médica', '2026-04-15 10:30', 'Completed', 8.5, 38.8, 'Dermatitis alérgica leve por pulgas.', 'Shampoo medicado cada 5 días y desparasitante externo oral.')", [idToby]);
                            });

                            db.run("INSERT INTO pets (name, species, breed, owner_id) VALUES ('Mila', 'Perro', 'Golden Retriever', ?)", [idValeria], function() {
                                const idMila = this.lastID;
                                db.run("INSERT INTO appointments (pet_id, service, appointment_date, status) VALUES (?, 'Baño y Deslanado', '2026-05-11 14:00', 'Scheduled')", [idMila]);
                            });

                            db.run("INSERT INTO pets (name, species, breed, owner_id) VALUES ('Simón', 'Gato', 'Persa', ?)", [idAndrea], function() {
                                const idSimon = this.lastID;
                                db.run("INSERT INTO appointments (pet_id, service, appointment_date, status, weight_kg, temperature_c, diagnosis, prescribed_medication) VALUES (?, 'Consulta Médica', '2026-05-05 16:15', 'Completed', 4.2, 39.1, 'Otitis en el oído derecho, secreción oscura.', 'Limpieza de oído diario y gotas óticas 2 gotas cada 12 horas por 7 días.')", [idSimon]);
                            });
                        });
                    });
                });
            }
        });
    });
}

initDb();

module.exports = db;
