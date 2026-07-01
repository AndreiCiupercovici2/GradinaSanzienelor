const MealModel = require('../models/mealModel');

const { getLanguage, t, validateReservationInput, sanitizeText, sendConfirmationEmail } = require('../utils/helpers');

const MAX_MEAL_CAPACITY = 20;

const MealController = {

    // ENDPOINT: POST /api/meal/reservation
    createReservation: async (req, res) => {
        const lang = getLanguage(req);
        const bodyData = req.body;

        // Map incoming fields to expected format
        const nameParts = (bodyData.name || '').trim().split(/\s+/, 2);
        const first_name = nameParts[0] || '';
        const last_name = nameParts[1] || '';

        const mappedData = {
            first_name: first_name,
            last_name: last_name,
            email: bodyData.email,
            phone: bodyData.phone,
            start_date: bodyData.reservation_date,
            adults: bodyData.adults,
            wants_cabin: false,
            newsletter: bodyData.newsletter || false
        };

        // Validate input data
        const validationErrors = validateReservationInput(mappedData, lang, true);
        if (validationErrors) {
            return res.status(400).json({ errors: validationErrors.join(', ') });
        }

        // Sanitize input data
        let finalName = first_name.trim() + ' ' + last_name.trim();
        finalName = sanitizeText(finalName);

        // Validate capacity
        const totalGuests = parseInt(mappedData.adults) || 1;
        if (totalGuests < 1 || totalGuests > MAX_MEAL_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_capacity', lang) });
        }

        try {
            // Check availability
            const existingGuests = await MealModel.checkAvailability(mappedData.start_date);
            if (existingGuests + totalGuests > MAX_MEAL_CAPACITY) {
                return res.status(400).json({ errors: t('no_availability', lang) });
            }

            // Save in db
            const dbData = {
                ...mappedData,
                first_name: sanitizeText(first_name.trim()),
                last_name: sanitizeText(last_name.trim()),
                totalGuests: totalGuests
            };

            const insertedId = await MealModel.createReservation(dbData);

            // Send confirmation email
            await sendConfirmationEmail(dbData, 'meal');
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