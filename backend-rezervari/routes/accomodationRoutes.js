const express = require('express');
const router = express.Router();
const AccomodationController = require('../controllers/accomodationController');

router.post('/reservation', AccomodationController.createReservation);
router.get('/availability', AccomodationController.getAvailability);

module.exports = router;