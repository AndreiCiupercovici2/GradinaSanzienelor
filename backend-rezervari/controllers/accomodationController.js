const AccomodationModel = require('../models/accomodationModel');

const { getLanguage, t, validateReservationInput, sanitizeText, sendConfirmationEmail } = require('../utils/helpers');

const MAX_CABIN_CAPACITY = 8;
const MIN_CABIN_CAPACITY = 1;

const AccomodationController = {

    // ENDPOINT: POST /api/accomodation/reservation
    createReservation: async (req, res) => {
        const lang = getLanguage(req);
        const bodyData = req.body;

        // Validate input data
        const validationErrors = validateReservationInput(bodyData, lang, false);
        if (validationErrors) {
            return res.status(400).json({ errors: validationErrors.join(', ') });
        }

        // Sanitize input data
        let finalName = bodyData.first_name.trim() + ' ' + bodyData.last_name.trim();
        finalName = sanitizeText(finalName);

        // Validate capacity 
        const totalGuests = parseInt(bodyData.adults) || 1;
        if (totalGuests < MIN_CABIN_CAPACITY || totalGuests > MAX_CABIN_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_capacity', lang) });
        }

        try {
            // Check availability
            const existingGuests = await AccomodationModel.checkAvailability(bodyData.start_date, bodyData.end_date);
            if (existingGuests + totalGuests > MAX_CABIN_CAPACITY) {
                return res.status(400).json({ errors: t('no_availability', lang) });
            }

            // Save in db
            const dbData = {
                ...bodyData,
                first_name: sanitizeText(bodyData.first_name.trim()),
                last_name: sanitizeText(bodyData.last_name.trim()),
                totalGuests: totalGuests
            };

            const insertedId = await AccomodationModel.createReservation(dbData);

            // Send confirmation email
            await sendConfirmationEmail(bodyData, 'cabin');
            return res.status(201).json({ message: t('reservation_success', lang), reservationId: insertedId });
        } catch (error) {
            console.error('Error creating reservation:', error);
            return res.status(500).json({ errors: t('server_error', lang) });
        }
    },

    // ENDPOINT: GET /api/accomodation/availability
    getAvailability: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const rows = await AccomodationModel.getAvailability();
            res.json(rows);
        } catch (error) {
            console.error('Error fetching availability:', error);
            res.status(500).json({ errors: t('server_error', lang) });
        }
    }
};

const createReservationWithTransaction = async (req, res) => {
    try {
        db.run("BEGIN TRANSACTION");
        const id = await accomodationModel.createReservation(req.body);
        // await draftModel.deleteDraft(...); // You can perform multiple actions here
        db.run("COMMIT");
        res.status(201).json({ id });
    } catch (err) {
        db.run("ROLLBACK");
        res.status(500).json({ error: err.message });
    }
};

module.exports = AccomodationController;