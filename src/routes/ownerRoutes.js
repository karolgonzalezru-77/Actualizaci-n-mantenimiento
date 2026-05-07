const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

router.get('/', ownerController.getAllOwners);
router.get('/new', ownerController.getCreateForm);
router.post('/new', ownerController.createOwner);

module.exports = router;
