const db = require('../config/db');

exports.getAllOwners = (req, res) => {
    db.all("SELECT * FROM owners ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.render('owners/index', { title: 'Dueños', owners: rows, query: req.query });
    });
};

exports.getCreateForm = (req, res) => {
    res.render('owners/create', { title: 'Registrar Dueño' });
};

exports.createOwner = (req, res) => {
    const { name, phone, email } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).render('owners/create', { title: 'Registrar Dueño', error: 'El nombre es obligatorio' });
    }
    db.run("INSERT INTO owners (name, phone, email) VALUES (?, ?, ?)", [name.trim(), phone || null, email || null], function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/owners');
    });
};
