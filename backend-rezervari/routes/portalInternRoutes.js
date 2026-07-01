const express = require('express');
const router = express.Router();
const portalInternController = require('../controllers/portalInternController');

router.get('/portalIntern/cabin', portalInternController.getAllCabinReservations);
router.get('/portalIntern/meal', portalInternController.getAllMealReservations);
router.get('/portalIntern/drafts', portalInternController.getActiveDrafts);
router.post('/portalIntern/decision', portalInternController.handleDecision);

module.exports = router;