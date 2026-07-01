const MealModel = require('../models/mealModel');

const {
    getLanguage,
    t,
    validateReservationInput,
    sanitizeText,
    sanitizeName,
    MAX_MEAL_CAPACITY,
    isValidInteger,
    isValidBoolean,
    containsMaliciousPatterns
} = require('../utils/helpers');

const MealController = {
    createReservation: async (req, res) => {
        console.log('Received request body:', req.body);
        const lang = getLanguage(req);

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        const bodyData = req.body;
        const first_name = bodyData.first_name;
        const last_name = bodyData.last_name;
        const email = bodyData.email;
        const phone = bodyData.phone;
        const reservation_date = bodyData.reservation_date;
        const adults = bodyData.adults;
        const pets = bodyData.pets || 0;
        const newsletter = bodyData.newsletter;
        const wants_cabin = bodyData.wants_cabin;

        if (typeof first_name !== 'string' || typeof last_name !== 'string') {
            console.log('Invalid first_name or last_name:', { first_name, last_name });
            return res.status(400).json({ errors: t('invalid_name', lang) });
        }

        if (typeof email !== 'string' || typeof phone !== 'string') {
            console.log('Invalid email or phone:', { email, phone });
            return res.status(400).json({ errors: t('invalid_email', lang) });
        }

        if (typeof wants_cabin !== 'boolean' && wants_cabin !== undefined && wants_cabin !== null) {
            console.log('Invalid wants_cabin value:', wants_cabin);
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        if (typeof reservation_date !== 'string') {
            console.log('Invalid reservation_date value:', reservation_date);
            return res.status(400).json({ errors: t('invalid_reservation_date', lang) });
        }

        if (!isValidInteger(adults)) {
            console.log('Invalid adults value:', adults);
            return res.status(400).json({ errors: t('invalid_integer', lang) });
        }

        if (!isValidInteger(pets) && pets !== undefined && pets !== null && pets !== '') {
            console.log('Invalid pets value:', pets);
            return res.status(400).json({ errors: t('invalid_integer', lang) });
        }

        if (newsletter !== undefined && newsletter !== null && !isValidBoolean(newsletter)) {
            console.log('Invalid newsletter value:', newsletter);
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        const mappedData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            phone: phone,
            reservation_date: reservation_date,
            adults: parseInt(adults, 10),
            pets: parseInt(pets, 10) || 0,
            wants_cabin: wants_cabin ? true : false,
            newsletter: newsletter ? true : false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const validationErrors = validateReservationInput(mappedData, lang, true);
        if (validationErrors) {
            return res.status(400).json({ errors: validationErrors.join(', ') });
        }

        const sanitizedFirstName = sanitizeName(first_name);
        const sanitizedLastName = sanitizeName(last_name);

        const totalGuests = mappedData.adults;
        if (totalGuests < 1 || totalGuests > MAX_MEAL_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_meal_max_persons', lang) });
        }

        try {
            const existingGuests = await MealModel.checkAvailability(mappedData.reservation_date);
            console.log(`Total capacity= ${MAX_MEAL_CAPACITY}, Existing guests for ${mappedData.reservation_date}:`, existingGuests);
            if (existingGuests + totalGuests > MAX_MEAL_CAPACITY) {
                return res.status(400).json({ errors: t('no_availability', lang) });
            }

            const dbData = {
                first_name: sanitizedFirstName,
                last_name: sanitizedLastName,
                email: sanitizeText(email),
                phone: sanitizeText(phone),
                reservation_date: reservation_date,
                adults: mappedData.adults,
                pets: mappedData.pets,
                wants_cabin: mappedData.wants_cabin ? true : false,
                newsletter: mappedData.newsletter ? true : false,
                created_at: mappedData.created_at,
                updated_at: mappedData.updated_at
            };

            const insertedId = await MealModel.createReservation(dbData);
            return res.status(201).json({ message: t('meal_success', lang), reservationId: insertedId });
        } catch (error) {
            console.error('Error creating meal reservation:', error);
            return res.status(500).json({ errors: t('save_error', lang) });
        }
    },

    getAvailability: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const reservedDates = await MealModel.getReservedDates();
            return res.status(200).json({ reservedDates });
        } catch (error) {
            console.error('Error fetching meal availability:', error);
            return res.status(500).json({ errors: t('availability_error', lang) });
        }
    }
};

module.exports = MealController;