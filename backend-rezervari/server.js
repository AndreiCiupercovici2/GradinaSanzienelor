const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static('public'));
app.use('/flatpickr', express.static('node_modules/flatpickr/dist'));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const CAPACITATE_MAX_CABANA = 8;
const MIN_NR_CABANA = 1;
const MAX_PERSOANE_MANCARE = 15;
const MAX_CAMERE = 3;
const MIN_CAMERE = 1;

const messages = {
    ro: {
        num_persoane_invalid: `Numărul de persoane trebuie să fie între ${MIN_NR_CABANA} și ${CAPACITATE_MAX_CABANA}.`,
        availability_error: 'Eroare la verificarea disponibilității.',
        fully_booked: 'Cabana nu mai are locuri disponibile în perioada selectată.',
        save_error: 'Eroare la salvarea rezervării.',
        commit_error: 'Eroare la confirmare.',
        cabin_success: 'Cererea de rezervare a fost trimisă pentru aprobare.',
        food_success: 'Cererea de masă trimisă pentru aprobare.',
        invalid_type: 'Tip rezervare invalid.',
        invalid_decision: 'Decizie invalidă.',
        invalid_id: 'ID invalid.',
        update_error: 'Eroare la actualizare.',
        not_found: 'Rezervare nu a fost găsită.',
        data_error: 'Eroare la preluarea datelor.',
        update_success: (decizie) => `Rezervare ${decizie} cu succes.`,
        invalid_adults: 'Adulți trebuie să fie cel puțin 1.',
        invalid_infants: 'Copii nu pot fi negativi.',
        invalid_pets: 'Animale de companie nu pot fi negative.',
        invalid_rooms: 'Camere necesare trebuie să fie între 1 și 3.',
        invalid_meal_max_persons: 'Maxim 15 persoane permise pentru mese.',
        invalid_same_day_after_10am: 'Cererea pentru azi nu mai este acceptată. Vă rog sunați.',
        invalid_nume: 'Nume invalid.',
        invalid_email: 'Email invalid.',
        invalid_telefon: 'Telefon invalid.',
        invalid_data_rezervare: 'Data rezervare invalidă.',
        invalid_ora: 'Ora invalidă.',
        invalid_data_inceput: 'Data început invalidă.',
        invalid_data_sfarsit: 'Data sfârșit invalidă.',
        invalid_data_sfarsit_dupa_inceput: 'Data sfârșit trebuie după data început.'
    },
    en: {
        num_persoane_invalid: `Number of people must be between ${MIN_NR_CABANA} and ${CAPACITATE_MAX_CABANA}.`,
        availability_error: 'Error checking availability.',
        fully_booked: 'Cabin has no available spots for this period.',
        save_error: 'Error saving reservation.',
        commit_error: 'Error confirming reservation.',
        cabin_success: 'Reservation request submitted for approval.',
        food_success: 'Meal request submitted for approval.',
        invalid_type: 'Invalid reservation type.',
        invalid_decision: 'Invalid decision.',
        invalid_id: 'Invalid ID.',
        update_error: 'Error updating reservation.',
        not_found: 'Reservation not found.',
        data_error: 'Error retrieving data.',
        update_success: (decizie) => `Reservation ${decizie} successfully.`,
        invalid_adults: 'Adults must be at least 1.',
        invalid_infants: 'Infants cannot be negative.',
        invalid_pets: 'Pets cannot be negative.',
        invalid_rooms: 'Rooms needed must be between 1 and 3.',
        invalid_meal_max_persons: 'Maximum 15 people allowed for meals.',
        invalid_same_day_after_10am: 'Same-day requests are no longer accepted. Please call.',
        invalid_nume: 'Invalid name.',
        invalid_email: 'Invalid email.',
        invalid_telefon: 'Invalid phone number.',
        invalid_data_rezervare: 'Invalid reservation date.',
        invalid_ora: 'Invalid time.',
        invalid_data_inceput: 'Invalid start date.',
        invalid_data_sfarsit: 'Invalid end date.',
        invalid_data_sfarsit_dupa_inceput: 'End date must be after start date.'
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

    // For non-food (cabin), accept either nume OR both first_name + last_name
    if (isFood) {
        if (!data.nume || !sanitizeText(data.nume)) errors.push(t('invalid_nume', lang));
    } else {
        const hasNume = data.nume && sanitizeText(data.nume);
        const hasNames = data.first_name && sanitizeText(data.first_name) && data.last_name && sanitizeText(data.last_name);
        if (!hasNume && !hasNames) errors.push(t('invalid_nume', lang));
    }

    if (!isValidEmail(data.email)) errors.push(t('invalid_email', lang));
    if (!isValidPhoneNumber(data.telefon)) errors.push(t('invalid_telefon', lang));

    const adults = parseInt(data.adults) || 0;
    const infants = parseInt(data.infants) || 0;
    const pets = parseInt(data.pets) || 0;
    const totalPeople = adults + infants;

    if (adults < 1) errors.push(t('invalid_adults', lang));
    if (infants < 0) errors.push(t('invalid_infants', lang));
    if (pets < 0) errors.push(t('invalid_pets', lang));

    if (isFood) {
        if (!isValidDate(data.data_rezervare)) errors.push(t('invalid_data_rezervare', lang));
        if (!data.ora) errors.push(t('invalid_ora', lang));
        if (totalPeople > MAX_PERSOANE_MANCARE) errors.push(t('invalid_meal_max_persons', lang));
        if (isToday(data.data_rezervare) && isAfter10Am()) errors.push(t('invalid_same_day_after_10am', lang));
    } else {
        if (!isValidDate(data.data_inceput)) errors.push(t('invalid_data_inceput', lang));
        if (!isValidDate(data.data_sfarsit)) errors.push(t('invalid_data_sfarsit', lang));
        if (new Date(data.data_inceput) >= new Date(data.data_sfarsit)) errors.push(t('invalid_data_sfarsit_dupa_inceput', lang));

        const rooms = parseInt(data.rooms_needed) || 1;
        if (rooms < MIN_CAMERE || rooms > MAX_CAMERE) errors.push(t('invalid_rooms', lang));

        if (isToday(data.data_inceput) && isAfter10Am()) errors.push(t('invalid_same_day_after_10am', lang));
    }

    return errors.length > 0 ? errors : null;
};

const sendConfirmationEmail = async (detaliiRezervare, tipRezervare) => {
    try {
        const emailText = detaliiRezervare.email || 'Nu a lăsat email';
        let continutEmail = `Ai o rezervare nouă pentru: ${tipRezervare}\n\n`;

        const adults = parseInt(detaliiRezervare.adults) || 1;
        const infants = parseInt(detaliiRezervare.infants) || 0;
        const pets = parseInt(detaliiRezervare.pets) || 0;
        const totalPeople = adults + infants;

        continutEmail += `\nCompunerea grupului:\n`;
        continutEmail += `- Adulți: ${adults}\n`;
        continutEmail += `- Copii: ${infants}\n`;
        continutEmail += `- Animale de companie: ${pets}\n`;
        continutEmail += `Persoane total: ${totalPeople}\n`;

        if (tipRezervare === 'cabana') {
            continutEmail += `\nData început: ${detaliiRezervare.data_inceput}\n`;
            continutEmail += `Data sfârșit: ${detaliiRezervare.data_sfarsit}\n`;
            continutEmail += `Camere necesare: ${detaliiRezervare.rooms_needed || 1}\n`;
            continutEmail += `Vrea meniu: ${detaliiRezervare.vrea_meniu ? 'Da' : 'Nu'}\n`;
            continutEmail += `Vrea cada cu apă fierbinte: ${detaliiRezervare.vrea_hottub ? 'Da' : 'Nu'}\n`;
            continutEmail += `Consimțământ newsletter: ${detaliiRezervare.newsletter ? 'Da' : 'Nu'}\n`;
        } else {
            continutEmail += `\nData: ${detaliiRezervare.data_rezervare}\n`;
            continutEmail += `Ora: ${detaliiRezervare.ora}\n`;
        }

        continutEmail += `\nPentru a vedea detaliile și a aproba sau anula rezervarea, accesează: ${BASE_URL}/admin.html`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Nouă rezervare - ${tipRezervare}`,
            text: continutEmail
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to SQLite database.');
});

db.serialize(() => {

    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS rezervari_cabana (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    email TEXT,
    telefon TEXT NOT NULL,
    data_inceput DATE NOT NULL,
    data_sfarsit DATE NOT NULL,
    numar_persoane INTEGER NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    infants INTEGER NOT NULL DEFAULT 0,
    pets INTEGER NOT NULL DEFAULT 0,
    rooms_needed INTEGER NOT NULL DEFAULT 1,
    vrea_meniu BOOLEAN NOT NULL,
    data_rezervare TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'in asteptare'
    )`);

    // Create table for food orders
    db.run(`CREATE TABLE IF NOT EXISTS rezervari_mancare (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    email TEXT,
    telefon TEXT NOT NULL,
    data_rezervare DATE NOT NULL,
    ora TIME NOT NULL,
    numar_persoane INTEGER NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    infants INTEGER NOT NULL DEFAULT 0,
    pets INTEGER NOT NULL DEFAULT 0,
    data_comanda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'in asteptare'
    )`);

    // Create table for reservation drafts
    db.run(`CREATE TABLE IF NOT EXISTS reservation_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_type TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    form_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
    )`);

    db.all("PRAGMA table_info(rezervari_cabana)", [], (err, columns) => {
        const columnNames = (columns || []).map(c => c.name);
        if (!columnNames.includes('adults')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN adults INTEGER NOT NULL DEFAULT 1");
        }
        if (!columnNames.includes('infants')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN infants INTEGER NOT NULL DEFAULT 0");
        }
        if (!columnNames.includes('pets')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN pets INTEGER NOT NULL DEFAULT 0");
        }
        if (!columnNames.includes('rooms_needed')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN rooms_needed INTEGER NOT NULL DEFAULT 1");
        }
        if (!columnNames.includes('salutation')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN salutation TEXT DEFAULT ''");
        }
        if (!columnNames.includes('first_name')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN first_name TEXT DEFAULT ''");
        }
        if (!columnNames.includes('last_name')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN last_name TEXT DEFAULT ''");
        }
        if (!columnNames.includes('vrea_hottub')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN vrea_hottub BOOLEAN DEFAULT 0");
        }
        if (!columnNames.includes('newsletter')) {
            db.run("ALTER TABLE rezervari_cabana ADD COLUMN newsletter BOOLEAN DEFAULT 0");
        }
    });

    db.all("PRAGMA table_info(rezervari_mancare)", [], (err, columns) => {
        const columnNames = (columns || []).map(c => c.name);
        if (!columnNames.includes('adults')) {
            db.run("ALTER TABLE rezervari_mancare ADD COLUMN adults INTEGER NOT NULL DEFAULT 1");
        }
        if (!columnNames.includes('infants')) {
            db.run("ALTER TABLE rezervari_mancare ADD COLUMN infants INTEGER NOT NULL DEFAULT 0");
        }
        if (!columnNames.includes('pets')) {
            db.run("ALTER TABLE rezervari_mancare ADD COLUMN pets INTEGER NOT NULL DEFAULT 0");
        }
    });
});

app.post('/api/rezervari_cabana', async (req, res) => {
    const lang = getLanguage(req);
    const {
        nume,
        salutation,
        first_name,
        last_name,
        email,
        telefon,
        data_inceput,
        data_sfarsit,
        numar_persoane,
        vrea_meniu,
        vrea_hottub,
        adults,
        infants,
        pets,
        rooms_needed,
        newsletter,
        pets_info
    } = req.body;

    const validationErrors = validateReservationInput(req.body, lang, false);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Build nume from first_name/last_name if not provided
    let finalNume = nume;
    if (!finalNume) {
        finalNume = `${salutation || ''} ${first_name || ''} ${last_name || ''}`.trim();
    }

    const totalPeople = (parseInt(adults) || 1) + (parseInt(infants) || 0);
    if (totalPeople < MIN_NR_CABANA || totalPeople > CAPACITATE_MAX_CABANA) {
        return res.status(400).json({ error: t('num_persoane_invalid', lang) });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION", (beginErr) => {
            if (beginErr) {
                console.error('BEGIN TRANSACTION error:', beginErr);
                return res.status(500).json({ error: t('save_error', lang) });
            }

            const sqlVerificare = `
                SELECT SUM(adults + infants) AS total_oaspeti
                FROM rezervari_cabana
                WHERE status = 'confirmat'
                AND NOT (data_sfarsit <= ? OR data_inceput >= ?)`;

            db.get(sqlVerificare, [data_inceput, data_sfarsit], (err, row) => {
                if (err) {
                    db.run("ROLLBACK", (rollbackErr) => {
                        if (rollbackErr) console.error('ROLLBACK error:', rollbackErr);
                    });
                    return res.status(500).json({ error: t('availability_error', lang) });
                }

                const oaspetiExistenti = row.total_oaspeti || 0;
                if (oaspetiExistenti + totalPeople > CAPACITATE_MAX_CABANA) {
                    db.run("ROLLBACK", (rollbackErr) => {
                        if (rollbackErr) console.error('ROLLBACK error:', rollbackErr);
                    });
                    return res.status(400).json({ error: t('fully_booked', lang) });
                }

                const sqlInsert = `INSERT INTO rezervari_cabana (nume, salutation, first_name, last_name, email, telefon, data_inceput, data_sfarsit, numar_persoane, adults, infants, pets, rooms_needed, vrea_meniu, vrea_hottub, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sqlInsert, [
                    sanitizeText(finalNume),
                    sanitizeText(salutation || ''),
                    sanitizeText(first_name || ''),
                    sanitizeText(last_name || ''),
                    email,
                    sanitizeText(telefon),
                    data_inceput,
                    data_sfarsit,
                    totalPeople,
                    adults,
                    infants,
                    pets,
                    rooms_needed,
                    vrea_meniu ? 1 : 0,
                    vrea_hottub ? 1 : 0,
                    newsletter ? 1 : 0
                ], function(err) {
                    if (err) {
                        db.run("ROLLBACK", (rollbackErr) => {
                            if (rollbackErr) console.error('ROLLBACK error:', rollbackErr);
                        });
                        return res.status(500).json({ error: t('save_error', lang) });
                    }

                    const insertedId = this.lastID;
                    db.run("COMMIT", async (commitErr) => {
                        if (commitErr) {
                            console.error('COMMIT error:', commitErr);
                            return res.status(500).json({ error: t('commit_error', lang) });
                        }

                        await sendConfirmationEmail(req.body, 'cabana');
                        res.status(201).json({ message: t('cabin_success', lang), id: insertedId });
                    });
                });
            });
        });
    });
});

app.post('/api/rezervari_mancare', async (req, res) => {
    const lang = getLanguage(req);
    const { nume, email, telefon, data_rezervare, ora, numar_persoane, adults, infants, pets } = req.body;

    const validationErrors = validateReservationInput(req.body, lang, true);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const totalPeople = (parseInt(adults) || 1) + (parseInt(infants) || 0);
    if (totalPeople > MAX_PERSOANE_MANCARE) {
        return res.status(400).json({ error: t('invalid_meal_max_persons', lang) });
    }

    const sql = `INSERT INTO rezervari_mancare (nume, email, telefon, data_rezervare, ora, numar_persoane, adults, infants, pets) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [sanitizeText(nume), email, sanitizeText(telefon), data_rezervare, ora, totalPeople, adults, infants, pets], async function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: t('save_error', lang) });
        }

        await sendConfirmationEmail(req.body, 'mancare');
        return res.status(201).json({ message: t('food_success', lang), id: this.lastID });
    });
});

app.post('/api/admin/decizie', (req, res) => {
    const lang = getLanguage(req);
    const { id, tipRezervare, decizie } = req.body;

    if (!['cabana', 'mancare'].includes(tipRezervare)) {
        return res.status(400).json({ error: t('invalid_type', lang) });
    }
    if (!['confirmat', 'anulat'].includes(decizie)) {
        return res.status(400).json({ error: t('invalid_decision', lang) });
    }
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: t('invalid_id', lang) });
    }

    const tabel = tipRezervare === 'cabana' ? 'rezervari_cabana' : 'rezervari_mancare';
    const sql = `UPDATE ${tabel} SET status = ? WHERE id = ?`;

    db.run(sql, [decizie, id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: t('update_error', lang) });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: t('not_found', lang) });
        }
        return res.json({ message: t('update_success', lang, decizie) });
    });
});

app.get('/api/zile_ocupate', (req, res) => {
    const lang = getLanguage(req);
    const sql = `SELECT data_inceput, data_sfarsit, numar_persoane FROM rezervari_cabana WHERE status = 'confirmat'`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: t('data_error', lang) });
        }
        return res.json(rows || []);
    });
});

app.get('/api/admin/cabana', (req, res) => {
    const lang = getLanguage(req);
    db.all(`SELECT * FROM rezervari_cabana ORDER BY data_rezervare DESC`, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: t('data_error', lang) });
        }
        return res.json(rows || []);
    });
});

app.get('/api/admin/mancare', (req, res) => {
    const lang = getLanguage(req);
    db.all(`SELECT * FROM rezervari_mancare ORDER BY data_comanda DESC`, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: t('data_error', lang) });
        }
        return res.json(rows || []);
    });
});

// Draft Reservation Endpoints

const saveDraft = (email, phone, reservationType, currentStep, formData) => {
    return new Promise((resolve, reject) => {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const formDataJson = JSON.stringify(formData);

        // Step 3 or higher with filled email/phone: look for existing draft first
        if (currentStep >= 3 && email && phone) {
            db.get(
                `SELECT id FROM reservation_drafts WHERE email = ? AND phone = ? AND reservation_type = ?`,
                [email, phone, reservationType],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        return updateExistingDraft(row.id);
                    }

                    // If not found with filled email/phone, look for Step 1 draft with empty values
                    db.get(
                        `SELECT id FROM reservation_drafts
                         WHERE (email = '' OR email IS NULL) AND (phone = '' OR phone IS NULL)
                         AND reservation_type = ?
                         ORDER BY updated_at DESC LIMIT 1`,
                        [reservationType],
                        (err, step1Row) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            if (step1Row) {
                                return updateExistingDraft(step1Row.id);
                            }

                            insertNewDraft();
                        }
                    );
                }
            );
        } else {
            // Step 1 or no complete email/phone: look by type only
            db.get(
                `SELECT id FROM reservation_drafts
                 WHERE (email = ? OR (? = '' AND email = ''))
                 AND (phone = ? OR (? = '' AND phone = ''))
                 AND reservation_type = ?
                 ORDER BY updated_at DESC LIMIT 1`,
                [email, email, phone, phone, reservationType],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (row) {
                        return updateExistingDraft(row.id);
                    }

                    insertNewDraft();
                }
            );
        }

        function updateExistingDraft(draftId) {
            db.run(
                `UPDATE reservation_drafts
                 SET current_step = ?, form_data = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP, expires_at = ?
                 WHERE id = ?`,
                [currentStep, formDataJson, email || '', phone || '', expiresAt, draftId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Updated draft ${draftId} to step ${currentStep}`);
                        resolve({ draftId: draftId, isNew: false });
                    }
                }
            );
        }

        function insertNewDraft() {
            db.run(
                `INSERT INTO reservation_drafts (email, phone, reservation_type, current_step, form_data, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [email || '', phone || '', reservationType, currentStep, formDataJson, expiresAt],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`Created new draft ${this.lastID} for step ${currentStep}`);
                        resolve({ draftId: this.lastID, isNew: true });
                    }
                }
            );
        }
    });
};

app.post('/api/reservations/draft', async (req, res) => {
    const lang = getLanguage(req);
    const { email, phone, reservation_type, current_step, step_data } = req.body;

    // For drafts, only validate email/phone IF they are provided (non-empty).
    // Empty email/phone are allowed for all draft steps since this is a temporary save.
    // Full validation happens when the reservation is actually submitted.
    if (email && !isValidEmail(email)) {
        return res.status(400).json({ error: t('invalid_email', lang) });
    }
    if (phone && !isValidPhoneNumber(phone)) {
        return res.status(400).json({ error: t('invalid_telefon', lang) });
    }

    if (!['mancare', 'cabana'].includes(reservation_type)) {
        return res.status(400).json({ error: t('invalid_type', lang) });
    }
    if (![1, 2, 3, 4].includes(current_step)) {
        return res.status(400).json({ error: 'Invalid step. Must be 1, 2, 3 or 4.' });
    }
    if (!step_data || typeof step_data !== 'object') {
        return res.status(400).json({ error: 'Invalid step_data. Must be an object.' });
    }

    try {
        const result = await saveDraft(email || '', phone || '', reservation_type, current_step, step_data);
        return res.status(result.isNew ? 201 : 200).json({
            success: true,
            draft_id: result.draftId,
            message: result.isNew ? 'Draft created successfully.' : 'Draft updated successfully.'
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: t('save_error', lang) });
    }
});

app.get('/api/reservations/draft', (req, res) => {
    const lang = getLanguage(req);
    const { email, phone, reservation_type } = req.query;

    // For draft retrieval, allow empty email/phone to support resuming drafts at step 1-2.
    // Only validate format if email/phone are provided (non-empty).
    if (email && !isValidEmail(email)) {
        return res.status(400).json({ error: t('invalid_email', lang) });
    }
    if (phone && !isValidPhoneNumber(phone)) {
        return res.status(400).json({ error: t('invalid_telefon', lang) });
    }
    if (!['mancare', 'cabana'].includes(reservation_type)) {
        return res.status(400).json({ error: t('invalid_type', lang) });
    }

    db.get(
        `SELECT * FROM reservation_drafts
         WHERE email = ? AND phone = ? AND reservation_type = ?
         AND expires_at > CURRENT_TIMESTAMP`,
        [email || '', phone || '', reservation_type],
        (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: t('data_error', lang) });
            }

            if (row) {
                return res.json({
                    found: true,
                    draft: {
                        id: row.id,
                        current_step: row.current_step,
                        form_data: JSON.parse(row.form_data),
                        created_at: row.created_at,
                        updated_at: row.updated_at
                    }
                });
            }

            return res.json({ found: false });
        }
    );
});

app.delete('/api/reservations/draft/:id', (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: t('invalid_id', lang) });
    }

    db.run(
        `DELETE FROM reservation_drafts WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: t('update_error', lang) });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: t('not_found', lang) });
            }

            return res.json({ success: true, message: 'Draft deleted successfully.' });
        }
    );
});

app.post('/api/reservations/draft/:id/send-reminder', async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: t('invalid_id', lang) });
    }

    db.get(
        `SELECT * FROM reservation_drafts WHERE id = ?`,
        [id],
        async (err, draft) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: t('data_error', lang) });
            }

            if (!draft) {
                return res.status(404).json({ error: t('not_found', lang) });
            }

            try {
                const formData = JSON.parse(draft.form_data);
                const clientName = formData.nume || 'Friend';
                const reservationType = draft.reservation_type === 'mancare' ? 'Mâncare' : 'Cabană';
                const createdDate = new Date(draft.created_at).toLocaleDateString('ro-RO');
                const resumeLink = `${BASE_URL}?resume_draft=${draft.id}&email=${encodeURIComponent(draft.email)}&phone=${encodeURIComponent(draft.phone)}`;

                const emailContent = `
Salut ${clientName},

Observă că ai o rezervare nefinalizată pentru ${reservationType}, înregistrată pe ${createdDate}.

Poți continua să completezi formularul accesând următorul link:
${resumeLink}

Datele tale vor fi șterse în 24 de ore din momentul înregistrării.

Dacă ai întrebări, ne poți contacta.

Cu plăcere,
Echipa Grădina Sânzienelor
                `.trim();

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: draft.email,
                    subject: `Reluare rezervare - ${reservationType}`,
                    text: emailContent
                });

                return res.json({ success: true, message: 'Reminder email sent successfully.' });
            } catch (error) {
                console.error('Email sending error:', error);
                return res.status(500).json({ error: 'Failed to send reminder email.' });
            }
        }
    );
});

app.post('/api/reservations/draft/:id/mark-completed', (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: t('invalid_id', lang) });
    }

    db.run(
        `DELETE FROM reservation_drafts WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: t('update_error', lang) });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: t('not_found', lang) });
            }

            return res.json({ success: true, message: 'Draft marked as completed and removed.' });
        }
    );
});

app.get('/api/admin/drafts', (req, res) => {
    const lang = getLanguage(req);
    db.all(
        `SELECT id, reservation_type, email, phone, current_step, created_at, updated_at
         FROM reservation_drafts
         WHERE expires_at > CURRENT_TIMESTAMP
         ORDER BY updated_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: t('data_error', lang) });
            }

            return res.json(rows || []);
        }
    );
});

// Scheduled cleanup job for expired drafts (runs every hour)
setInterval(() => {
    db.run(
        `DELETE FROM reservation_drafts WHERE expires_at <= CURRENT_TIMESTAMP`,
        function(err) {
            if (err) {
                console.error('Error cleaning up expired drafts:', err);
            } else if (this.changes > 0) {
                console.log(`Cleaned up ${this.changes} expired draft(s).`);
            }
        }
    );
}, 60 * 60 * 1000); // Every hour

app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});
