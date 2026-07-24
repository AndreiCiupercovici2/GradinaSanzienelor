const express = require('express');
const router = express.Router();
const MealController = require('../controllers/mealController');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateMealReservation, validateReservationId } = require('../middlewares/reservationValidator');

const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/meal_reservations', validateMealReservation, validateRequest, MealController.createReservation);
router.patch('/meal_reservations/:id/cancel', authMiddleware, validateReservationId, validateRequest, MealController.cancelReservation);
router.get('/meal_availability', MealController.getAvailability);

module.exports = router;