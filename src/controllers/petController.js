const db = require('../config/db');

exports.getAllPets = (req, res) => {
    db.all(`SELECT p.*, o.name as owner_name 
            FROM pets p 
            JOIN owners o ON p.owner_id = o.id 
            ORDER BY p.name`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.render('pets/index', { title: 'Mascotas', pets: rows, query: req.query });
    });
};

exports.getCreateForm = (req, res) => {
    db.all("SELECT id, name FROM owners ORDER BY name", [], (err, owners) => {
        if (err) return res.status(500).send(err.message);
        if (!owners || owners.length === 0) {
            return res.redirect('/owners?msg=' + encodeURIComponent('Primero debe registrar al menos un dueño.'));
        }
        res.render('pets/create', { title: 'Registrar Mascota', owners });
    });
};

exports.createPet = (req, res) => {
    const { name, species, breed, owner_id } = req.body;
    if (!name || !name.trim()) {
        return db.all("SELECT id, name FROM owners ORDER BY name", [], (err, owners) => {
            if (err) return res.status(500).send(err.message);
            res.status(400).render('pets/create', { title: 'Registrar Mascota', owners, error: 'El nombre es obligatorio' });
        });
    }
    const ownerId = parseInt(owner_id, 10);
    if (!ownerId || isNaN(ownerId)) {
        return db.all("SELECT id, name FROM owners ORDER BY name", [], (err, owners) => {
            if (err) return res.status(500).send(err.message);
            res.status(400).render('pets/create', { title: 'Registrar Mascota', owners, error: 'Debe seleccionar un dueño válido.' });
        });
    }
    // Criterio 2: Verificar que el dueño existe
    db.get("SELECT id FROM owners WHERE id = ?", [ownerId], (err, owner) => {
        if (err) return res.status(500).send(err.message);
        if (!owner) {
            return db.all("SELECT id, name FROM owners ORDER BY name", [], (e, owners) => {
                if (e) return res.status(500).send(e.message);
                res.status(400).render('pets/create', { title: 'Registrar Mascota', owners, error: 'El dueño seleccionado no es válido.' });
            });
        }
        db.run("INSERT INTO pets (name, species, breed, owner_id) VALUES (?, ?, ?, ?)",
            [name.trim(), species || 'Perro', breed || null, ownerId], function(insertErr) {
            if (insertErr) return res.status(500).send(insertErr.message);
            res.redirect('/pets');
        });
    });
};

exports.getMedicalHistory = (req, res) => {
    const petId = req.params.id;
    db.get(`SELECT p.*, o.name as owner_name 
            FROM pets p 
            JOIN owners o ON p.owner_id = o.id 
            WHERE p.id = ?`, [petId], (err, pet) => {
        if (err) return res.status(500).send(err.message);
        if (!pet) return res.status(404).send('Mascota no encontrada');
        
        db.all(`SELECT * FROM appointments 
                WHERE pet_id = ? 
                ORDER BY appointment_date DESC`, [petId], (err, appointments) => {
            if (err) return res.status(500).send(err.message);
            res.render('pets/history', { title: 'Historial Clínico - ' + pet.name, pet, appointments });
        });
    });
};
