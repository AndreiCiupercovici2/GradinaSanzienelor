const AccomodationModel = require('../models/accomodationModel');

const { sendConfirmationEmail } = require('../utils/mailer');

const {
    getLanguage,
    t,
    validateReservationInput,
    sanitizeText,
    sanitizeName,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
    MAX_ROOMS,
    MIN_ROOMS,
    isValidInteger,
    isValidBoolean,
    containsMaliciousPatterns
} = require('../utils/helpers');

const AccomodationController = {
    createReservation: async (req, res) => {
        const lang = getLanguage(req);

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        const bodyData = req.body;
        const first_name = bodyData.first_name;
        const last_name = bodyData.last_name;
        const email = bodyData.email;
        const phone = bodyData.phone;
        const start_date = bodyData.start_date;
        const end_date = bodyData.end_date;
        const adults = bodyData.adults;
        const pets = bodyData.pets;
        const rooms_needed = bodyData.rooms_needed;
        const wants_meal = bodyData.wants_meal;
        const wants_hottub = bodyData.wants_hottub;
        const newsletter = bodyData.newsletter;
        const arrival_time = bodyData.arrival_time;

        if (typeof first_name !== 'string' || typeof last_name !== 'string') {
            return res.status(400).json({ errors: t('invalid_name', lang) });
        }

        if (typeof email !== 'string' || typeof phone !== 'string') {
            return res.status(400).json({ errors: t('invalid_email', lang) });
        }

        if (typeof start_date !== 'string' || typeof end_date !== 'string') {
            return res.status(400).json({ errors: t('invalid_start_date', lang) });
        }

        if (typeof arrival_time !== 'string') {
            return res.status(400).json({ errors: t('invalid_arrival_time', lang) });
        }

        if (!isValidInteger(adults)) {
            return res.status(400).json({ errors: t('invalid_integer', lang) });
        }

        if (!isValidInteger(rooms_needed)) {
            return res.status(400).json({ errors: t('invalid_integer', lang) });
        }

        if (wants_meal !== undefined && wants_meal !== null && !isValidBoolean(wants_meal)) {
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        if (wants_hottub !== undefined && wants_hottub !== null && !isValidBoolean(wants_hottub)) {
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        if (newsletter !== undefined && newsletter !== null && !isValidBoolean(newsletter)) {
            return res.status(400).json({ errors: t('invalid_input_size', lang) });
        }

        const mappedData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            phone: phone,
            start_date: start_date,
            end_date: end_date,
            arrival_time: arrival_time,
            adults: parseInt(adults, 10),
            pets: pets,
            rooms_needed: parseInt(rooms_needed, 10),
            wants_meal: wants_meal,
            wants_hottub: wants_hottub,
            newsletter: newsletter,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const validationErrors = validateReservationInput(mappedData, lang, false);
        if (validationErrors) {
            return res.status(400).json({ errors: validationErrors.join(', ') });
        }

        const sanitizedFirstName = sanitizeName(first_name);
        const sanitizedLastName = sanitizeName(last_name);

        const totalGuests = mappedData.adults;
        if (totalGuests < MIN_CABIN_CAPACITY || totalGuests > MAX_CABIN_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_persons_count', lang) });
        }

        try {
            const existingGuests = await AccomodationModel.checkAvailability(mappedData.start_date, mappedData.end_date);
            if (existingGuests + totalGuests > MAX_CABIN_CAPACITY) {
                return res.status(400).json({ errors: t('fully_booked', lang) });
            }

            const dbData = {
                first_name: sanitizedFirstName,
                last_name: sanitizedLastName,
                email: sanitizeText(email),
                phone: sanitizeText(phone),
                start_date: start_date,
                end_date: end_date,
                arrival_time: arrival_time,
                adults: mappedData.adults,
                pets: mappedData.pets,
                rooms_needed: mappedData.rooms_needed,
                wants_meal: mappedData.wants_meal ? true : false,
                wants_hottub: mappedData.wants_hottub ? true : false,
                newsletter: mappedData.newsletter ? true : false,
                created_at: mappedData.created_at,
                updated_at: mappedData.updated_at
            };

            const insertedId = await AccomodationModel.createReservation(dbData);
            sendConfirmationEmail(dbData, 'cabin');
            return res.status(201).json({ message: t('cabin_success', lang), reservationId: insertedId });
        } catch (error) {
            console.error('Error creating accommodation reservation:', error);
            return res.status(500).json({ errors: t('save_error', lang) });
        }
    },

    getAvailability: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await AccomodationModel.getAvailability();
            return res.status(200).json(rows);
        } catch (error) {
            console.error('Error fetching accommodation availability:', error);
            return res.status(500).json({ errors: t('availability_error', lang) });
        }
    }
};

module.exports = AccomodationController;