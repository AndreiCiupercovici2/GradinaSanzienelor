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

    if (!data.nume || !sanitizeText(data.nume)) errors.push(t('invalid_nume', lang));
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
    const { nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu, adults, infants, pets, rooms_needed } = req.body;

    const validationErrors = validateReservationInput(req.body, lang, false);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const totalPeople = (parseInt(adults) || 1) + (parseInt(infants) || 0);
    if (totalPeople < MIN_NR_CABANA || totalPeople > CAPACITATE_MAX_CABANA) {
        return res.status(400).json({ error: t('num_persoane_invalid', lang) });
    }

    return new Promise((resolve) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const sqlVerificare = `
                SELECT SUM(adults + infants) AS total_oaspeti
                FROM rezervari_cabana
                WHERE status = 'confirmat'
                AND NOT (data_sfarsit <= ? OR data_inceput >= ?)`;

            db.get(sqlVerificare, [data_inceput, data_sfarsit], (err, row) => {
                if (err) {
                    db.run("ROLLBACK");
                    resolve(res.status(500).json({ error: t('availability_error', lang) }));
                    return;
                }

                const oaspetiExistenti = row.total_oaspeti || 0;
                if (oaspetiExistenti + totalPeople > CAPACITATE_MAX_CABANA) {
                    db.run("ROLLBACK");
                    resolve(res.status(400).json({ error: t('fully_booked', lang) }));
                    return;
                }

                const sqlInsert = `INSERT INTO rezervari_cabana (nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, adults, infants, pets, rooms_needed, vrea_meniu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                db.run(sqlInsert, [sanitizeText(nume), email, sanitizeText(telefon), data_inceput, data_sfarsit, totalPeople, adults, infants, pets, rooms_needed, vrea_meniu ? 1 : 0], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        resolve(res.status(500).json({ error: t('save_error', lang) }));
                        return;
                    }

                    db.run("COMMIT", async (err) => {
                        if (err) {
                            resolve(res.status(500).json({ error: t('commit_error', lang) }));
                            return;
                        }

                        await sendConfirmationEmail(req.body, 'cabana');
                        resolve(res.status(201).json({ message: t('cabin_success', lang), id: this.lastID }));
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

        db.get(
            `SELECT id FROM reservation_drafts WHERE email = ? AND phone = ? AND reservation_type = ?`,
            [email, phone, reservationType],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // Update existing draft
                    db.run(
                        `UPDATE reservation_drafts
                         SET current_step = ?, form_data = ?, updated_at = CURRENT_TIMESTAMP, expires_at = ?
                         WHERE id = ?`,
                        [currentStep, formDataJson, expiresAt, row.id],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ draftId: row.id, isNew: false });
                            }
                        }
                    );
                } else {
                    // Insert new draft
                    db.run(
                        `INSERT INTO reservation_drafts (email, phone, reservation_type, current_step, form_data, expires_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [email, phone, reservationType, currentStep, formDataJson, expiresAt],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ draftId: this.lastID, isNew: true });
                            }
                        }
                    );
                }
            }
        );
    });
};

app.post('/api/reservations/draft', async (req, res) => {
    const lang = getLanguage(req);
    const { email, phone, reservation_type, current_step, step_data } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: t('invalid_email', lang) });
    }
    if (!phone || !isValidPhoneNumber(phone)) {
        return res.status(400).json({ error: t('invalid_telefon', lang) });
    }
    if (!['mancare', 'cabana'].includes(reservation_type)) {
        return res.status(400).json({ error: t('invalid_type', lang) });
    }
    if (![1, 2].includes(current_step)) {
        return res.status(400).json({ error: 'Invalid step. Must be 1 or 2.' });
    }
    if (!step_data || typeof step_data !== 'object') {
        return res.status(400).json({ error: 'Invalid step_data. Must be an object.' });
    }

    try {
        const result = await saveDraft(email, phone, reservation_type, current_step, step_data);
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

    // Validation
    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: t('invalid_email', lang) });
    }
    if (!phone || !isValidPhoneNumber(phone)) {
        return res.status(400).json({ error: t('invalid_telefon', lang) });
    }
    if (!['mancare', 'cabana'].includes(reservation_type)) {
        return res.status(400).json({ error: t('invalid_type', lang) });
    }

    db.get(
        `SELECT * FROM reservation_drafts
         WHERE email = ? AND phone = ? AND reservation_type = ?
         AND expires_at > CURRENT_TIMESTAMP`,
        [email, phone, reservation_type],
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
Echipa Diana
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