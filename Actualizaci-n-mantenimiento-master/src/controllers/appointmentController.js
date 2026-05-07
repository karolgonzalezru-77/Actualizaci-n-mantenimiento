const db = require('../config/db');

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

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

exports.getVisitsTimeline = (req, res) => {
    db.all(`SELECT a.id, a.pet_id, a.service, a.appointment_date, a.status, a.weight_kg, a.temperature_c, a.diagnosis, a.prescribed_medication,
                   p.name as pet_name, o.name as owner_name
            FROM appointments a
            JOIN pets p ON a.pet_id = p.id
            JOIN owners o ON p.owner_id = o.id
            ORDER BY a.pet_id ASC, a.appointment_date ASC`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);

        const timelineByPet = rows.reduce((acc, visitRow) => {
            const visit = { ...visitRow, appointment_date: formatDateTime(visitRow.appointment_date) };
            if (!acc[visit.pet_id]) {
                acc[visit.pet_id] = {
                    pet_id: visit.pet_id,
                    pet_name: visit.pet_name,
                    owner_name: visit.owner_name,
                    visits: []
                };
            }
            acc[visit.pet_id].visits.push(visit);
            return acc;
        }, {});

        res.render('timeline', {
            title: 'Cronología de Visitas',
            petsTimeline: Object.values(timelineByPet)
        });
    });
};

exports.getMedicalHistory = (req, res) => {
    const selectedPetId = req.query.pet_id ? parseInt(req.query.pet_id, 10) : null;

    db.all(`SELECT p.id, p.name as pet_name, o.name as owner_name
            FROM pets p
            JOIN owners o ON p.owner_id = o.id
            ORDER BY p.id ASC`, [], (petsErr, pets) => {
        if (petsErr) return res.status(500).send(petsErr.message);

        const validPet = selectedPetId && pets.some((p) => p.id === selectedPetId);
        const petFilter = validPet ? [selectedPetId] : [];
        const whereClause = validPet
            ? `WHERE a.pet_id = ? AND (a.service = 'Consulta Médica' OR a.weight_kg IS NOT NULL OR a.temperature_c IS NOT NULL OR a.diagnosis IS NOT NULL OR a.prescribed_medication IS NOT NULL)`
            : `WHERE (a.service = 'Consulta Médica' OR a.weight_kg IS NOT NULL OR a.temperature_c IS NOT NULL OR a.diagnosis IS NOT NULL OR a.prescribed_medication IS NOT NULL)`;

        db.all(`SELECT a.id, a.pet_id, a.service, a.appointment_date, a.status, a.weight_kg, a.temperature_c, a.diagnosis, a.prescribed_medication,
                       p.name as pet_name, o.name as owner_name
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN owners o ON p.owner_id = o.id
                ${whereClause}
                ORDER BY a.pet_id ASC, a.appointment_date ASC`, petFilter, (historyErr, rows) => {
            if (historyErr) return res.status(500).send(historyErr.message);

            const historyByPet = rows.reduce((acc, visitRow) => {
                const visit = { ...visitRow, appointment_date: formatDateTime(visitRow.appointment_date) };
                if (!acc[visit.pet_id]) {
                    acc[visit.pet_id] = {
                        pet_id: visit.pet_id,
                        pet_name: visit.pet_name,
                        owner_name: visit.owner_name,
                        visits: []
                    };
                }
                acc[visit.pet_id].visits.push(visit);
                return acc;
            }, {});

            res.render('medical-history', {
                title: 'Expediente Médico',
                pets,
                selectedPetId: validPet ? selectedPetId : '',
                historyByPet: Object.values(historyByPet)
            });
        });
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
    const { pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescribed_medication } = req.body;
    const petId = parseInt(pet_id, 10);
    if (!petId || isNaN(petId)) {
        return res.redirect('/create');
    }
    const isMedical = (service || '').trim() === 'Consulta Médica';
    const weightVal = weight_kg === '' || weight_kg == null ? null : parseFloat(weight_kg);
    const tempVal = temperature_c === '' || temperature_c == null ? null : parseFloat(temperature_c);
    const diagnosisVal = (diagnosis || '').trim();
    const medicationVal = (prescribed_medication || '').trim();
    if (isMedical) {
        const invalidWeight = weightVal == null || Number.isNaN(weightVal) || weightVal <= 0;
        const invalidTemp = tempVal == null || Number.isNaN(tempVal) || tempVal <= 0;
        const invalidDiagnosis = diagnosisVal.length === 0;
        const invalidMedication = medicationVal.length === 0;
        if (invalidWeight || invalidTemp || invalidDiagnosis || invalidMedication) {
            return res.status(400).redirect('/create');
        }
    }
    db.get("SELECT id FROM pets WHERE id = ?", [petId], (err, pet) => {
        if (err) return res.status(500).send(err.message);
        if (!pet) return res.status(400).redirect('/create');
        db.run(
            "INSERT INTO appointments (pet_id, service, appointment_date, weight_kg, temperature_c, diagnosis, prescribed_medication) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [petId, service, appointment_date, isMedical ? weightVal : null, isMedical ? tempVal : null, isMedical ? diagnosisVal : null, isMedical ? medicationVal : null],
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
