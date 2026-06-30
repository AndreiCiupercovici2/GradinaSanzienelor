const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/cabin-reservations', AdminController.getAllCabinReservations);
router.get('/meal-reservations', AdminController.getAllMealReservations);
router.get('/active-drafts', AdminController.getActiveDrafts);
router.post('/decision', AdminController.handleDecision);

module.exports = router;