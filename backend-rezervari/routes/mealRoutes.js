const express = require('express');
const router = express.Router();
const MealController = require('../controllers/mealController');
const { validateRequest } = require('../middlewares/validateRequest');
const { validateMealReservation } = require('../middlewares/reservationValidator');

router.post('/meal_reservations', validateMealReservation, validateRequest, MealController.createReservation);
router.get('/meal_availability', MealController.getAvailability);

module.exports = router;