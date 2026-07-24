const AccomodationModel = require('../models/accomodationModel');
const { matchedData } = require('express-validator');

const { sendConfirmationEmail } = require('../utils/mailer');

const {
    getLanguage,
    t,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
    MAX_ROOMS,
    MIN_ROOMS,
} = require('../utils/helpers');

const AccomodationController = {
    createReservation: async (req, res) => {
        const lang = getLanguage(req);

        const {
            first_name,
            last_name,
            email,
            phone,
            start_date,
            end_date,
            adults,
            pets,
            rooms_needed,
            wants_meal,
            wants_hottub,
            newsletter,
            arrival_time
        } = req.body;

       const totalGuests = parseInt(adults, 10);
       if (totalGuests < MIN_CABIN_CAPACITY || totalGuests > MAX_CABIN_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_persons_count', lang) });
        }

        try {
            const existingGuests = await AccomodationModel.checkAvailability(start_date, end_date);
            if (existingGuests + totalGuests > MAX_CABIN_CAPACITY) {
                return res.status(400).json({ errors: t('fully_booked', lang) });
            }

            const dbData = {
                first_name,
                last_name,
                email,
                phone,
                start_date,
                end_date,
                arrival_time,
                adults: totalGuests,
                pets,
                rooms_needed: parseInt(rooms_needed, 10),
                wants_meal: wants_meal ? true : false,
                wants_hottub: wants_hottub ? true : false,
                newsletter: newsletter ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const insertedId = await AccomodationModel.createReservation(dbData);
            sendConfirmationEmail(dbData, 'cabin');
            return res.status(201).json({ message: t('cabin_success', lang), reservationId: insertedId });
        } catch (error) {
            console.error('Error creating accommodation reservation:', error);
            return res.status(500).json({ errors: t('save_error', lang) });
        }
    },

    cancelReservation: async (req, res) => {
        const lang = getLanguage(req);
        const { id } = matchedData(req);

        try {
            const rowsChanged = await AccomodationModel.cancelReservation(id);

            if (rowsChanged === 0) {
                return res.status(404).json({ errors: t('not_found', lang) });
            }
            return res.status(200).json({ message: t('update_success', lang), rowsChanged });
        } catch (error) {
            console.error('Error cancelling accommodation reservation:', error);
            return res.status(500).json({ errors: t('update_error', lang) });
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