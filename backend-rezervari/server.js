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
        meal_max_persons: 'Maxim 15 persoane permise pentru mese.',
        same_day_after_10am: 'Cererea pentru azi nu mai este acceptată. Vă rog sunați.'
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
        meal_max_persons: 'Maximum 15 people allowed for meals.',
        same_day_after_10am: 'Same-day requests are no longer accepted. Please call.'
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

const validateReservationInput = (data, isFood = false) => {
    const errors = [];

    if (!data.nume || !sanitizeText(data.nume)) errors.push('Nume invalid');
    if (!isValidEmail(data.email)) errors.push('Email invalid');
    if (!isValidPhoneNumber(data.telefon)) errors.push('Telefon invalid');

    const adults = parseInt(data.adults) || 0;
    const infants = parseInt(data.infants) || 0;
    const pets = parseInt(data.pets) || 0;
    const totalPeople = adults + infants;

    if (adults < 1) errors.push('Adulți trebuie să fie cel puțin 1');
    if (infants < 0) errors.push('Copii nu pot fi negativi');
    if (pets < 0) errors.push('Animale de companie nu pot fi negative');

    if (isFood) {
        if (!isValidDate(data.data_rezervare)) errors.push('Data rezervare invalidă');
        if (!data.ora) errors.push('Ora invalidă');
        if (totalPeople > MAX_PERSOANE_MANCARE) errors.push(`Maxim ${MAX_PERSOANE_MANCARE} persoane pentru mese`);
        if (isToday(data.data_rezervare) && isAfter10Am()) errors.push('Cererea pentru azi nu mai este acceptată');
    } else {
        if (!isValidDate(data.data_inceput)) errors.push('Data început invalidă');
        if (!isValidDate(data.data_sfarsit)) errors.push('Data sfârșit invalidă');
        if (new Date(data.data_inceput) >= new Date(data.data_sfarsit)) errors.push('Data sfârșit trebuie după data început');

        const rooms = parseInt(data.rooms_needed) || 1;
        if (rooms < MIN_CAMERE || rooms > MAX_CAMERE) errors.push(`Camere necesare trebuie să fie între ${MIN_CAMERE} și ${MAX_CAMERE}`);

        if (isToday(data.data_inceput) && isAfter10Am()) errors.push('Cererea pentru azi nu mai este acceptată');
    }

    return errors.length > 0 ? errors : null;
};

const sendConfirmationEmail = async (detaliiRezervare, tipRezervare) => {
    try {
        const emailText = detaliiRezervare.email || 'Nu a lăsat email';
        let continutEmail = `Ai o rezervare nouă pentru: ${tipRezervare}\n\n`;
        continutEmail += `Nume: ${sanitizeText(detaliiRezervare.nume)}\n`;
        continutEmail += `Telefon: ${isValidPhoneNumber(detaliiRezervare.telefon)}\n`;
        continutEmail += `Email: ${emailText}\n`;

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

    const validationErrors = validateReservationInput(req.body, false);
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

    const validationErrors = validateReservationInput(req.body, true);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const totalPeople = (parseInt(adults) || 1) + (parseInt(infants) || 0);
    if (totalPeople > MAX_PERSOANE_MANCARE) {
        return res.status(400).json({ error: t('meal_max_persons', lang) });
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

app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});