const express = require('express');
const router = express.Router();
const portalInternController = require('../controllers/portalInternController');
const blockedDateController = require('../controllers/blockedDateController');

router.get('/portalIntern/cabin', portalInternController.getAllCabinReservations);
router.get('/portalIntern/meal', portalInternController.getAllMealReservations);
router.post('/portalIntern/decision', portalInternController.handleDecision);
router.post('/portalIntern/block-date', blockedDateController.blockDate);
router.get('/portalIntern/blocked-dates', blockedDateController.getBlockedDates);
router.delete('/portalIntern/blocked-dates/:id', blockedDateController.deleteBlockedDates);

module.exports = router;