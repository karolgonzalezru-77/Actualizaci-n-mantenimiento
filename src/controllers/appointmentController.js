const db = require('../config/db');

exports.getAllAppointments = (req, res) => {
    db.all(`SELECT a.*, p.name as pet_name, o.name as owner_name 
            FROM appointments a 
            JOIN pets p ON a.pet_id = p.id 
            JOIN owners o ON p.owner_id = o.id 
            ORDER BY a.appointment_date DESC`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.render('index', { title: 'Panel de Citas', appointments: rows });
    });
};

exports.getCreateForm = (req, res) => {
    db.all(`SELECT p.id, p.name as pet_name, o.name as owner_name 
            FROM pets p 
            JOIN owners o ON p.owner_id = o.id 
            ORDER BY p.name`, [], (err, pets) => {
        if (err) return res.status(500).send(err.message);
        if (!pets || pets.length === 0) {
            return res.redirect('/pets?msg=' + encodeURIComponent('Primero debe registrar al menos una mascota con su dueño.'));
        }
        res.render('create', { title: 'Agendar Nueva Cita', pets });
    });
};

exports.createAppointment = (req, res) => {
    const { pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescription } = req.body;
    const petId = parseInt(pet_id, 10);
    if (!petId || isNaN(petId)) {
        return res.redirect('/create');
    }
    const isMedical = (service || '').trim() === 'Consulta Médica';
    const weightVal = weight_kg === '' || weight_kg == null ? null : parseFloat(weight_kg);
    const tempVal = temperature_c === '' || temperature_c == null ? null : parseFloat(temperature_c);
    const diagnosisVal = (diagnosis || '').trim();
    const prescriptionVal = (prescription || '').trim();
    if (isMedical) {
        const invalidWeight = weightVal == null || Number.isNaN(weightVal) || weightVal <= 0;
        const invalidTemp = tempVal == null || Number.isNaN(tempVal) || tempVal <= 0;
        const invalidDiagnosis = diagnosisVal.length === 0;
        const invalidPrescription = prescriptionVal.length === 0;
        if (invalidWeight || invalidTemp || invalidDiagnosis || invalidPrescription) {
            return res.status(400).redirect('/create');
        }
    }
    db.get("SELECT id FROM pets WHERE id = ?", [petId], (err, pet) => {
        if (err) return res.status(500).send(err.message);
        if (!pet) return res.status(400).redirect('/create');
        db.run(
            "INSERT INTO appointments (pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescription) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [petId, service, appointment_date, isMedical ? weightVal : null, isMedical ? tempVal : null, isMedical ? diagnosisVal : null, isMedical ? prescriptionVal : null],
            function(insertErr) {
            if (insertErr) return res.status(500).send(insertErr.message);
            res.redirect('/');
        });
    });
};

exports.deleteAppointment = (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM appointments WHERE id = ?", id, function(err) {
        if (err) return res.status(500).send(err.message);
        res.redirect('/');
    });
};
