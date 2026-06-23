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
        update_success: (decizie) => `Rezervare ${decizie} cu succes.`
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
        update_success: (decizie) => `Reservation ${decizie} successfully.`
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

const validateReservationInput = (data, isFood = false) => {
    const errors = [];

    if (!data.nume || !sanitizeText(data.nume)) errors.push('Nume invalid');
    if (!isValidEmail(data.email)) errors.push('Email invalid');
    if (!isValidPhoneNumber(data.telefon)) errors.push('Telefon invalid');
    if (!data.numar_persoane || data.numar_persoane < 1) errors.push('Număr persoane invalid');

    if (isFood) {
        if (!isValidDate(data.data_rezervare)) errors.push('Data rezervare invalidă');
        if (!data.ora) errors.push('Ora invalidă');
    } else {
        if (!isValidDate(data.data_inceput)) errors.push('Data început invalidă');
        if (!isValidDate(data.data_sfarsit)) errors.push('Data sfârșit invalidă');
        if (new Date(data.data_inceput) >= new Date(data.data_sfarsit)) errors.push('Data sfârșit trebuie după data început');
    }

    return errors.length > 0 ? errors : null;
};

const sendConfirmationEmail = async (detaliiRezervare, tipRezervare) => {
    try {
        const telefonText = detaliiRezervare.telefon || 'Nu a lăsat număr de telefon';
        let continutEmail = `Ai o rezervare nouă pentru: ${tipRezervare}\n\n`;
        continutEmail += `Nume: ${sanitizeText(detaliiRezervare.nume)}\n`;
        continutEmail += `Email: ${detaliiRezervare.email}\n`;
        continutEmail += `Telefon: ${telefonText}\n`;
        continutEmail += `Număr persoane: ${detaliiRezervare.numar_persoane}\n`;

        if (tipRezervare === 'cabana') {
            continutEmail += `Data început: ${detaliiRezervare.data_inceput}\n`;
            continutEmail += `Data sfârșit: ${detaliiRezervare.data_sfarsit}\n`;
            continutEmail += `Vrea meniu: ${detaliiRezervare.vrea_meniu ? 'Da' : 'Nu'}\n`;
        } else {
            continutEmail += `Data: ${detaliiRezervare.data_rezervare}\n`;
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
    email TEXT NOT NULL,
    telefon TEXT,
    data_inceput DATE NOT NULL,
    data_sfarsit DATE NOT NULL,
    numar_persoane INTEGER NOT NULL,
    vrea_meniu BOOLEAN NOT NULL,
    data_rezervare TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'in asteptare'
    )`);

    // Create table for food orders
    db.run(`CREATE TABLE IF NOT EXISTS rezervari_mancare (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT,
    data_rezervare DATE NOT NULL,
    ora TIME NOT NULL,
    numar_persoane INTEGER NOT NULL,
    data_comanda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'in asteptare'
    )`);
});

app.post('/api/rezervari_cabana', async (req, res) => {
    const lang = getLanguage(req);
    const { nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu } = req.body;

    const validationErrors = validateReservationInput(req.body, false);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    if (numar_persoane < MIN_NR_CABANA || numar_persoane > CAPACITATE_MAX_CABANA) {
        return res.status(400).json({ error: t('num_persoane_invalid', lang) });
    }

    return new Promise((resolve) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const sqlVerificare = `
                SELECT SUM(numar_persoane) AS total_oaspeti
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
                if (oaspetiExistenti + numar_persoane > CAPACITATE_MAX_CABANA) {
                    db.run("ROLLBACK");
                    resolve(res.status(400).json({ error: t('fully_booked', lang) }));
                    return;
                }

                const sqlInsert = `INSERT INTO rezervari_cabana (nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(sqlInsert, [sanitizeText(nume), email, sanitizeText(telefon), data_inceput, data_sfarsit, numar_persoane, vrea_meniu ? 1 : 0], function(err) {
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
    const { nume, email, telefon, data_rezervare, ora, numar_persoane } = req.body;

    const validationErrors = validateReservationInput(req.body, true);
    if (validationErrors) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const sql = `INSERT INTO rezervari_mancare (nume, email, telefon, data_rezervare, ora, numar_persoane) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [sanitizeText(nume), email, sanitizeText(telefon), data_rezervare, ora, numar_persoane], async function(err) {
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