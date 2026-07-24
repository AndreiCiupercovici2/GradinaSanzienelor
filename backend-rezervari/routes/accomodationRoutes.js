const express = require('express');
const router = express.Router();
const AccomodationController = require('../controllers/accomodationController');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateCabinReservation, validateReservationId } = require('../middlewares/reservationValidator');

const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/cabin_reservations', validateCabinReservation, validateRequest, AccomodationController.createReservation);
router.patch('/cabin_reservations/:id/cancel', authMiddleware, validateReservationId, validateRequest, AccomodationController.cancelReservation);
router.get('/occupied_days', AccomodationController.getAvailability);

module.exports = router;