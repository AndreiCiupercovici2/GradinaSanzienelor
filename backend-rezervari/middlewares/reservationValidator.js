const { body, param } = require('express-validator');
const {
    t,
    getLanguage,
    isDateNotInPast,
    isToday,
    isAfter10Am,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
    MAX_MEAL_CAPACITY,
    MIN_MEAL_CAPACITY,
    MAX_ROOMS,
    MIN_ROOMS,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
} = require('../utils/helpers');

const commonValidations = [
    body('first_name')
        .trim()
        .notEmpty().withMessage((value, { req }) => t('invalid_name', getLanguage(req)))
        .isLength({ max: MAX_NAME_LENGTH }).withMessage((value, { req }) => t('invalid_name', getLanguage(req)))
        .escape(),

    body('last_name')
        .trim()
        .notEmpty().withMessage((value, { req }) => t('invalid_name', getLanguage(req)))
        .isLength({ max: MAX_NAME_LENGTH }).withMessage((value, { req }) => t('invalid_name', getLanguage(req)))
        .escape(),

    body('email')
        .trim()
        .isEmail().withMessage((value, { req }) => t('invalid_email', getLanguage(req)))
        .isLength({ max: MAX_EMAIL_LENGTH }).withMessage((value, { req }) => t('invalid_email', getLanguage(req)))
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty().withMessage((value, { req }) => t('invalid_phone', getLanguage(req)))
        .isLength({ max: MAX_PHONE_LENGTH }).withMessage((value, { req }) => t('invalid_phone', getLanguage(req)))
        .escape(),

    body('pets')
        .optional()
        .isString({ max: 255 }).withMessage((value, { req }) => t('invalid_pets', getLanguage(req)))
        .escape(),

    body('newsletter')
        .optional()
        .isBoolean().toBoolean()
];

const validateCabinReservation = [
    ...commonValidations,

    body('start_date')
        .isISO8601().withMessage((value, { req }) => t('invalid_start_date', getLanguage(req)))
        .custom((value, { req }) => {
            const language = getLanguage(req);
            if (!isDateNotInPast(value)) {
                throw new Error(t('invalid_date_past', language));
            }
            if (isToday(value) && isAfter10Am()) {
                throw new Error(t('invalid_date_past', language));
            }
            return true;
        }),

    body('end_date')
        .isISO8601().withMessage((value, { req }) => t('invalid_end_date', getLanguage(req)))
        .custom((value, { req }) => {
            const language = getLanguage(req);
            if (!isDateNotInPast(value)) {
                throw new Error(t('invalid_date_past', language));
            }
            if (new Date(value) <= new Date(req.body.start_date)) {
                throw new Error(t('invalid_end_before_start', language));
            }
            return true;
        }),
    body('arrival_time')
        .trim()
        .notEmpty().withMessage((value, { req }) => t('invalid_arrival_time', getLanguage(req)))
        .escape(),
    
    body('adults')
        .isInt({ min: MIN_CABIN_CAPACITY, max: MAX_CABIN_CAPACITY }).withMessage((value, { req }) => t('invalid_adults', getLanguage(req))),
    body('rooms_needed')
        .isInt({ min: MIN_ROOMS, max: MAX_ROOMS }).withMessage((value, { req }) => t('invalid_rooms_needed', getLanguage(req))),
    body('wants_meal')
        .optional()
        .isBoolean().toBoolean(),
    body('wants_hottub')
        .optional()
        .isBoolean().toBoolean()
];

const validateMealReservation = [
    ...commonValidations,

    body('reservation_date')
        .isISO8601().withMessage((value, { req }) => t('invalid_reservation_date', getLanguage(req)))
        .custom((value, { req }) => {
            const language = getLanguage(req);
            if (!isDateNotInPast(value)) {
                throw new Error(t('invalid_date_past', language));
            }
            if (isToday(value) && isAfter10Am()) {
                throw new Error(t('invalid_date_past', language));
            }
            return true;
        }),
    body('reservation_time')
        .trim()
        .notEmpty().withMessage((value, { req }) => t('invalid_time', getLanguage(req)))
        .escape(),
    body('adults')
        .isInt({ min: MIN_MEAL_CAPACITY, max: MAX_MEAL_CAPACITY }).withMessage((value, { req }) => t('invalid_adults', getLanguage(req))),
    body('wants_cabin')
        .optional()
        .isBoolean().toBoolean()
];

const validateReservationId = [
    param('id')
        .isInt().withMessage((value, { req }) => t('invalid_id', getLanguage(req)))
];

module.exports = {
    validateCabinReservation,
    validateMealReservation,
    validateReservationId
};