const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/admin/cabin', AdminController.getAllCabinReservations);
router.get('/admin/meal', AdminController.getAllMealReservations);
router.get('/admin/drafts', AdminController.getActiveDrafts);
router.post('/admin/decision', AdminController.handleDecision);

module.exports = router;