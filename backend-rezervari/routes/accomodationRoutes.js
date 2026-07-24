const express = require('express');
const router = express.Router();
const AccomodationController = require('../controllers/accomodationController');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateCabinReservation } = require('../middlewares/reservationValidator');

router.post('/cabin_reservations', validateCabinReservation, validateRequest, AccomodationController.createReservation);
router.get('/occupied_days', AccomodationController.getAvailability);

module.exports = router;