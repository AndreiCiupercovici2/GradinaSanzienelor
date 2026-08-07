const MealModel = require('../models/mealModel');
const BlockedDateModel = require('../models/blockedDateModel');

const { matchedData } = require('express-validator');

const { sendConfirmationEmail } = require('../utils/mailer');

const {
    getLanguage,
    t,
    MAX_MEAL_CAPACITY,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
} = require('../utils/helpers');

const MealController = {
    createReservation: async (req, res) => {
        console.log('Received request body:', req.body);
        const lang = getLanguage(req);

        const {
            first_name,
            last_name,
            email,
            phone,
            reservation_date,
            adults,
            pets,
            newsletter,
            wants_cabin,
            reservation_time,
            cabin_start_date,
            cabin_end_date
        } = req.body;

        if (wants_cabin) {
            if(!cabin_start_date || !cabin_end_date) {
                return res.status(400).json({ errors: t('cabin_dates_required', lang) });
            }
        }

        if (parseInt(adults, 10) > MAX_CABIN_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_total_persons_count', lang) });
        }

        const totalGuests = parseInt(adults, 10);
        if (totalGuests < MIN_CABIN_CAPACITY || totalGuests > MAX_MEAL_CAPACITY) {
            return res.status(400).json({ errors: t('invalid_meal_max_persons', lang) });
        }

        try {
            const blockedDates = await BlockedDateModel.getAllAsync();
            const isBlocked = blockedDates.some(b =>
                b.type === 'meal' &&
                reservation_date >= b.start_date &&
                reservation_date <= b.end_date
            );
            if (isBlocked) {
                return res.status(400).json({ errors: t('date_blocked', lang) });
            }
            const existingGuests = await MealModel.checkAvailability(reservation_date);
            console.log(`Total capacity= ${MAX_MEAL_CAPACITY}, Existing guests for ${reservation_date}:`, existingGuests);
            if (existingGuests + totalGuests > MAX_MEAL_CAPACITY) {
                return res.status(400).json({ errors: t('no_availability', lang) });
            }

            const dbData = {
                first_name,
                last_name,
                email,
                phone,
                reservation_date,
                reservation_time,
                adults: totalGuests,
                pets,
                wants_cabin: wants_cabin ? true : false,
                cabin_start_date: wants_cabin ? cabin_start_date : null,
                cabin_end_date: wants_cabin ? cabin_end_date : null,
                newsletter: newsletter ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const insertedId = await MealModel.createReservation(dbData);
            sendConfirmationEmail(dbData, 'meal');
            return res.status(201).json({ message: t('meal_success', lang), reservationId: insertedId });
        } catch (error) {
            console.error('Error creating meal reservation:', error);
            return res.status(500).json({ errors: t('save_error', lang) });
        }
    },

    cancelReservation: async (req, res) => {
        const lang = getLanguage(req);
        const { id } = matchedData(req);

        try {
            const rowsChanged = await MealModel.cancelReservation(id);
            if (rowsChanged === 0) {
                return res.status(404).json({ errors: t('not_found', lang) });
            }
            return res.status(200).json({ message: t('update_success', lang), rowsChanged });
        } catch (error) {
            console.error('Error cancelling meal reservation:', error);
            return res.status(500).json({ errors: t('cancel_error', lang) });
        }
    },

    getAvailability: async (req, res) => {
        const lang = getLanguage(req);
        try {
            const reservedDates = await MealModel.getReservedDates();
            return res.status(200).json({ reservedDates });
        } catch (error) {
            console.error('Error fetching meal availability:', error);
            return res.status(500).json({ errors: t('update_error', lang) });
        }
    }
};

module.exports = MealController;