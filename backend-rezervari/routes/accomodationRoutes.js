const express = require('express');
const router = express.Router();
const AccomodationController = require('../controllers/accomodationController');

router.post('/cabin_reservations', AccomodationController.createReservation);
router.get('/occupied_days', AccomodationController.getAvailability);

module.exports = router;