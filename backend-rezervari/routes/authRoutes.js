const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middlewares/auth.middleware');
const portalInternController = require('../controllers/portalInternController');
const accomodationController = require('../controllers/accomodationController');
const blockedDateController = require('../controllers/blockedDateController');
const mealController = require('../controllers/mealController');
const authController = require('../controllers/authController');

router.post('/portalIntern/login', authController.login);

router.post('/cabin_reservations', accomodationController.createReservation);
router.get('/occupied_days', accomodationController.getAvailability);
//router.post('/cabin-reservations/lookup', accomodationController.lookupReservation);
router.post('/meal_reservations', mealController.createReservation);
router.get('/meal_availability', mealController.getAvailability);
//router.post('/meal-reservations/lookup', mealController.lookupReservation);

const adminRouter = express.Router();

adminRouter.use(authMiddleware);

adminRouter.get('/cabin', portalInternController.getAllCabinReservations);
adminRouter.get('/meal', portalInternController.getAllMealReservations);
adminRouter.post('/decision', portalInternController.handleDecision);
adminRouter.post('/block-date', blockedDateController.blockDate);
adminRouter.get('/blocked-dates', blockedDateController.getBlockedDates);

router.use('/portalIntern', adminRouter);

module.exports = router;