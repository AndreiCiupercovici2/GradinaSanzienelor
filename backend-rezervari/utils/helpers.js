const MAX_CABIN_CAPACITY = 8;
const MIN_CABIN_CAPACITY = 1;
const MAX_MEAL_CAPACITY = 15;
const MAX_ROOMS = 3;
const MIN_ROOMS = 1;
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const messages = {
    ro: {
        invalid_persons_count: `Numărul de persoane trebuie să fie între ${MIN_CABIN_CAPACITY} și ${MAX_CABIN_CAPACITY}.`,
        availability_error: 'Eroare la verificarea disponibilității.',
        fully_booked: 'Cabana nu mai are locuri disponibile în perioada selectată.',
        save_error: 'Eroare la salvarea rezervării.',
        commit_error: 'Eroare la confirmare.',
        cabin_success: 'Cererea de rezervare a fost trimisă pentru aprobare.',
        meal_success: 'Cererea de masă trimisă pentru aprobare.',
        invalid_type: 'Tip rezervare invalid.',
        invalid_decision: 'Decizie invalidă.',
        invalid_id: 'ID invalid.',
        update_error: 'Eroare la actualizare.',
        not_found: 'Rezervare nu a fost găsită.',
        data_error: 'Eroare la preluarea datelor.',
        update_success: (decision) => `Rezervare ${decision} cu succes.`,
        invalid_adults: 'Adulți trebuie să fie cel puțin 1.',
        invalid_infants: 'Copii nu pot fi negativi.',
        invalid_pets: 'Animale de companie nu pot fi negative.',
        invalid_rooms: 'Camere necesare trebuie să fie între 1 și 3.',
        invalid_meal_max_persons: 'Maxim 15 persoane permise pentru mese.',
        invalid_same_day_after_10am: 'Cererea pentru azi nu mai este acceptată. Vă rog sunați.',
        invalid_name: 'Nume invalid.',
        invalid_email: 'Email invalid.',
        invalid_phone: 'Telefon invalid.',
        invalid_reservation_date: 'Data rezervare invalidă.',
        invalid_time: 'Ora invalidă.',
        invalid_start_date: 'Data început invalidă.',
        invalid_end_date: 'Data sfârșit invalidă.',
        invalid_end_before_start: 'Data sfârșit trebuie după data început.'
    },
    en: {
        invalid_persons_count: `Number of people must be between ${MIN_CABIN_CAPACITY} and ${MAX_CABIN_CAPACITY}.`,
        availability_error: 'Error checking availability.',
        fully_booked: 'Cabin has no available spots for this period.',
        save_error: 'Error saving reservation.',
        commit_error: 'Error confirming reservation.',
        cabin_success: 'Reservation request submitted for approval.',
        meal_success: 'Meal request submitted for approval.',
        invalid_type: 'Invalid reservation type.',
        invalid_decision: 'Invalid decision.',
        invalid_id: 'Invalid ID.',
        update_error: 'Error updating reservation.',
        not_found: 'Reservation not found.',
        data_error: 'Error retrieving data.',
        update_success: (decision) => `Reservation ${decision} successfully.`,
        invalid_adults: 'Adults must be at least 1.',
        invalid_infants: 'Infants cannot be negative.',
        invalid_pets: 'Pets cannot be negative.',
        invalid_rooms: 'Rooms needed must be between 1 and 3.',
        invalid_meal_max_persons: 'Maximum 15 people allowed for meals.',
        invalid_same_day_after_10am: 'Same-day requests are no longer accepted. Please call.',
        invalid_name: 'Invalid name.',
        invalid_email: 'Invalid email.',
        invalid_phone: 'Invalid phone number.',
        invalid_reservation_date: 'Invalid reservation date.',
        invalid_time: 'Invalid time.',
        invalid_start_date: 'Invalid start date.',
        invalid_end_date: 'Invalid end date.',
        invalid_end_before_start: 'End date must be after start date.'
    }
};

const getLanguage = (req) => {
    const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.slice(0, 2) || 'ro';
    return ['ro', 'en'].includes(lang) ? lang : 'ro';
};

const t = (key, lang, ...args) => {
    const msg = messages[lang]?.[key] || messages.ro[key];
    return typeof msg === 'function' ? msg(...args) : msg;
};

// Input validation helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidDate = (date) => !isNaN(Date.parse(date));
const isValidPhoneNumber = (phone) => !phone || /^[0-9\s\-\+()]{6,}$/.test(phone);
const sanitizeText = (text) => text?.trim().slice(0, 255) || '';

const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
};

const isAfter10Am = () => {
    const now = new Date();
    return now.getHours() >= 10;
};

const validateReservationInput = (data, lang, isFood = false) => {
    const errors = [];

    // Check for name fields: first_name + last_name
    const hasNames = data.first_name && sanitizeText(data.first_name) && data.last_name && sanitizeText(data.last_name);
    if (!hasNames) errors.push(t('invalid_name', lang));

    if (!isValidEmail(data.email)) errors.push(t('invalid_email', lang));
    if (!isValidPhoneNumber(data.phone)) errors.push(t('invalid_phone', lang));

    const adults = parseInt(data.adults) || 0;
    const infants = parseInt(data.infants) || 0;
    const pets = parseInt(data.pets) || 0;
    const totalPeople = adults + infants;

    if (adults < 1) errors.push(t('invalid_adults', lang));
    if (infants < 0) errors.push(t('invalid_infants', lang));
    if (pets < 0) errors.push(t('invalid_pets', lang));

    if (isFood) {
        if (!isValidDate(data.start_date)) errors.push(t('invalid_reservation_date', lang));
        if (!data.time) errors.push(t('invalid_time', lang));
        if (totalPeople > MAX_MEAL_CAPACITY) errors.push(t('invalid_meal_max_persons', lang));
        if (isToday(data.start_date) && isAfter10Am()) errors.push(t('invalid_same_day_after_10am', lang));
    } else {
        if (!isValidDate(data.start_date)) errors.push(t('invalid_start_date', lang));
        if (!isValidDate(data.end_date)) errors.push(t('invalid_end_date', lang));
        if (new Date(data.start_date) >= new Date(data.end_date)) errors.push(t('invalid_end_before_start', lang));

        const rooms = parseInt(data.rooms_needed) || 1;
        if (rooms < MIN_ROOMS || rooms > MAX_ROOMS) errors.push(t('invalid_rooms', lang));

        if (isToday(data.start_date) && isAfter10Am()) errors.push(t('invalid_same_day_after_10am', lang));
    }

    return errors.length > 0 ? errors : null;
};

module.exports = {
    getLanguage,
    t,
    validateReservationInput,
    sanitizeText,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
    MAX_MEAL_CAPACITY,
    MAX_ROOMS,
    MIN_ROOMS,
    isValidEmail,
    isValidDate,
    isValidPhoneNumber,
    isToday,
    isAfter10Am,
    BASE_URL
};