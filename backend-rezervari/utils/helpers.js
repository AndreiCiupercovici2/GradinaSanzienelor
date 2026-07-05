const MAX_CABIN_CAPACITY = 8;
const MIN_CABIN_CAPACITY = 1;
const MAX_MEAL_CAPACITY = 15;
const MAX_ROOMS = 3;
const MIN_ROOMS = 1;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 20;
const MAX_INPUT_SIZE = 1000;
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
        invalid_end_before_start: 'Data sfârșit trebuie după data început.',
        invalid_input_size: 'Date prea lungi.',
        invalid_date_past: 'Data nu poate fi în trecut.',
        invalid_integer: 'Valoare trebuie să fie număr întreg.'
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
        invalid_end_before_start: 'End date must be after start date.',
        invalid_input_size: 'Input data too long.',
        invalid_date_past: 'Date cannot be in the past.',
        invalid_integer: 'Value must be an integer.'
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

const isValidEmail = (email) => {
    if (!email || typeof email !== 'string' || email.length > MAX_EMAIL_LENGTH) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const isValidDate = (date) => {
    if (!date || typeof date !== 'string') return false;
    const parsed = Date.parse(date);
    return !isNaN(parsed);
};

const isDateNotInPast = (dateStr) => {
    if (!isValidDate(dateStr)) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
};

const isValidPhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    if (phone.length > MAX_PHONE_LENGTH || phone.length < 6) return false;
    return /^[0-9\s\-\+()]+$/.test(phone);
};

const isValidInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num >= 0;
};

const isValidBoolean = (value) => {
    return typeof value === 'boolean';
};

const containsMaliciousPatterns = (text) => {
    if (!text || typeof text !== 'string') return false;
    const patterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /eval\(/gi,
        /alert\(/gi
    ];
    return patterns.some(pattern => pattern.test(text));
};

const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    let sanitized = text.trim().slice(0, 255);
    sanitized = sanitized.replace(/[<>]/g, '');
    return sanitized;
};

const sanitizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    let sanitized = name.trim().slice(0, MAX_NAME_LENGTH);
    sanitized = sanitized.replace(/[<>"{};]/g, '');
    return sanitized;
};

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

const validateInputSize = (text) => {
    return !text || (typeof text === 'string' && text.length <= MAX_INPUT_SIZE);
};

const validateReservationInput = (data, lang, isFood = false) => {
    const errors = [];

    if (!data || typeof data !== 'object') {
        errors.push(t('invalid_input_size', lang));
        return errors;
    }

    const firstName = data.first_name;
    const lastName = data.last_name;

    if (!firstName || !lastName || typeof firstName !== 'string' || typeof lastName !== 'string') {
        errors.push(t('invalid_name', lang));
    } else if (!validateInputSize(firstName) || !validateInputSize(lastName)) {
        errors.push(t('invalid_input_size', lang));
    } else if (firstName.length === 0 || lastName.length === 0) {
        errors.push(t('invalid_name', lang));
    } else if (containsMaliciousPatterns(firstName) || containsMaliciousPatterns(lastName)) {
        errors.push(t('invalid_name', lang));
    }

    if (!isValidEmail(data.email)) {
        errors.push(t('invalid_email', lang));
    } else if (containsMaliciousPatterns(data.email)) {
        errors.push(t('invalid_email', lang));
    }

    if (!isValidPhoneNumber(data.phone)) {
        errors.push(t('invalid_phone', lang));
    } else if (containsMaliciousPatterns(data.phone)) {
        errors.push(t('invalid_phone', lang));
    }

    if (!isValidInteger(data.adults)) {
        errors.push(t('invalid_integer', lang));
    } else {
        const adults = parseInt(data.adults, 10);
        if (adults < 1) errors.push(t('invalid_adults', lang));
    }

    if (isFood) {
        if (!isValidDate(data.reservation_date)) {
            errors.push(t('invalid_reservation_date', lang));
        } else if (!isDateNotInPast(data.reservation_date)) {
            errors.push(t('invalid_date_past', lang));
        }

        if (isToday(data.reservation_date) && isAfter10Am()) {
            errors.push(t('invalid_same_day_after_10am', lang));
        }
    } else {
        if (!isValidDate(data.start_date)) {
            errors.push(t('invalid_start_date', lang));
        } else if (!isDateNotInPast(data.start_date)) {
            errors.push(t('invalid_date_past', lang));
        }

        if (!isValidDate(data.end_date)) {
            errors.push(t('invalid_end_date', lang));
        } else if (!isDateNotInPast(data.end_date)) {
            errors.push(t('invalid_date_past', lang));
        }

        if (isValidDate(data.start_date) && isValidDate(data.end_date)) {
            if (new Date(data.start_date) >= new Date(data.end_date)) {
                errors.push(t('invalid_end_before_start', lang));
            }
        }

        if (!isValidInteger(data.rooms_needed)) {
            errors.push(t('invalid_integer', lang));
        } else {
            const rooms = parseInt(data.rooms_needed, 10);
            if (rooms < MIN_ROOMS || rooms > MAX_ROOMS) {
                errors.push(t('invalid_rooms', lang));
            }
        }

        if (isToday(data.start_date) && isAfter10Am()) {
            errors.push(t('invalid_same_day_after_10am', lang));
        }
    }

    return errors.length > 0 ? errors : null;
};

module.exports = {
    getLanguage,
    t,
    validateReservationInput,
    sanitizeText,
    sanitizeName,
    MAX_CABIN_CAPACITY,
    MIN_CABIN_CAPACITY,
    MAX_MEAL_CAPACITY,
    MAX_ROOMS,
    MIN_ROOMS,
    MAX_NAME_LENGTH,
    MAX_EMAIL_LENGTH,
    MAX_PHONE_LENGTH,
    MAX_INPUT_SIZE,
    isValidEmail,
    isValidDate,
    isValidPhoneNumber,
    isValidInteger,
    isValidBoolean,
    isDateNotInPast,
    containsMaliciousPatterns,
    validateInputSize,
    isToday,
    isAfter10Am,
    BASE_URL
};