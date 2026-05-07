const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');

router.get('/', petController.getAllPets);
router.get('/new', petController.getCreateForm);
router.post('/new', petController.createPet);
router.get('/:id/history', petController.getMedicalHistory);

module.exports = router;
