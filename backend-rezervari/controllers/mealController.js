const MealModel = require('../models/mealModel');

const { getLanguage, t, validateReservationInput, sanitizeText, sendConfirmationEmail } = require('../utils/helpers');

const MAX_MEAL_CAPACITY = 20;

const MealController = {

    // ENDPOINT: POST /api/meal/reservation
    createReservation: async (req, res) => {
        const lang = getLanguage(req);
        const bodyData = req.body;

        // Validate input data
        const validationErrors = validateReservationInput(bodyData, lang, true);
        if (validationErrors) {
            return res.status(400).json({ errors: validationErrors.join(', ') });
        }

        // Sanitize input data
        let finalName = bodyData.first_name.trim() + ' ' + bodyData.last_name.trim();
        finalName = sanitizeText(finalName);

        // Validate capacity
        const totalGuests = parseInt(bodyData.adults) || 1;
        if (totalGuests < 1 || totalGuests > MAX_MEAL_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_capacity', lang) });
        }

        try {
            // Check availability
            const existingGuests = await MealModel.checkAvailability(bodyData.start_date);
            if (existingGuests + totalGuests > MAX_MEAL_CAPACITY) {
                return res.status(400).json({ errors: t('no_availability', lang) });
            }

            // Save in db
            const dbData = {
                ...bodyData,
                first_name: sanitizeText(bodyData.first_name.trim()),
                last_name: sanitizeText(bodyData.last_name.trim()),
                totalGuests: totalGuests
            };

            const insertedId = await MealModel.createReservation(dbData);

            // Send confirmation email
            await sendConfirmationEmail(bodyData, 'meal');
            return res.status(201).json({ message: t('reservation_success', lang), reservationId: insertedId });         
        } catch (error) {
            console.error('Error creating meal reservation:', error);
            return res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    getAvailability: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const reservedDates = await MealModel.getReservedDates();
            return res.status(200).json({ reservedDates });
        } catch (error) {
            console.error('Error fetching meal availability:', error);
            return res.status(500).json({ errors: t('server_error', lang) });
        }
    }
};

module.exports = MealController;