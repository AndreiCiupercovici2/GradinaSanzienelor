const express = require('express');
const router = express.Router();
const MealController = require('../controllers/mealController');

router.post('/meal_reservations', MealController.createReservation);
router.get('/meal_availability', MealController.getAvailability);

module.exports = router;