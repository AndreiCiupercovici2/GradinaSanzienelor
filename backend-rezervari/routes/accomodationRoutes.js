const express = require('express');
const router = express.Router();
const AccomodationController = require('../controllers/accomodationController');

router.post('/cabinReservations', AccomodationController.createReservation);
router.get('/availability', AccomodationController.getAvailability);

module.exports = router;