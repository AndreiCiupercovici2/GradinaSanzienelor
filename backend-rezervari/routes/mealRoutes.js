const express = require('express');
const router = express.Router();
const MealController = require('../controllers/mealController');

router.post('/mealReservations', MealController.createReservation);
router.get('/availability', MealController.getAvailability);

module.exports = router;