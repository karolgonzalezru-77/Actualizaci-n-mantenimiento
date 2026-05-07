const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');

router.get('/', petController.getAllPets);
router.get('/new', petController.getCreateForm);
router.post('/new', petController.createPet);

module.exports = router;
