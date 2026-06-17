const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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

const sendConfirmationEmail = (detaliiRezervare, tipRezervare) => {
    const TelefonText = detaliiRezervare.telefon ? detaliiRezervare.telefon : 'Nu a lasat numar de telefon';
    let continutEmail = `Ai o rezervare noua pentru: ${tipRezervare}\n\n`;
    continutEmail += `Nume: ${detaliiRezervare.nume}\n`;
    continutEmail += `Email: ${detaliiRezervare.email}\n`;
    continutEmail += `Telefon: ${TelefonText}\n`;
    continutEmail += `Data rezervare: ${detaliiRezervare.data_rezervare}\n`;
    continutEmail += `Numar persoane: ${detaliiRezervare.numar_persoane}\n`;
    if (tipRezervare === 'cabana') {
        continutEmail += `Data inceput: ${detaliiRezervare.data_inceput}\n`;
        continutEmail += `Data sfarsit: ${detaliiRezervare.data_sfarsit}\n`;
        continutEmail += `Vrea meniu: ${detaliiRezervare.vrea_meniu ? 'Da' : 'Nu'}\n`;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `Confirmare rezervare pentru ${tipRezervare}`,
        text: continutEmail
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
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

app.post('/api/rezervari_cabana', (req, res) => {
    const { nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu } = req.body;

    if (numar_persoane < MIN_NR_CABANA ) {
        return res.status(400).json({ error: `Numarul minim de persoane pentru cabana este ${MIN_NR_CABANA}.` });
    }

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
                return res.status(500).json({ error: 'Eroare la verificarea disponibilității.' });
            }
            const oaspetiExistenti = row.total_oaspeti || 0;

            if (oaspetiExistenti + numar_persoane > CAPACITATE_MAX_CABANA) {
                db.run("ROLLBACK");
                return res.status(400).json({ error: 'Ne pare rău, cabana este complet ocupată sau nu mai are destule locuri în această perioadă.' });
            }

            const sqlInsert = `INSERT INTO rezervari_cabana (nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(sqlInsert, [nume, email, telefon, data_inceput, data_sfarsit, numar_persoane, vrea_meniu], function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Eroare la salvarea rezervării.' });
                }
                db.run("COMMIT");

                sendConfirmationEmail(req.body, 'cabana');

                return res.status(201).json({ message: 'Cererea de rezervare a fost trimisă pentru aprobare.', id: this.lastID });
            });
        });
    });
});

app.post('/api/rezervari_mancare', (req, res) => {
    const { nume, email, telefon, data_rezervare, ora, numar_persoane } = req.body;
    const sql = `INSERT INTO rezervari_mancare (nume, email, telefon, data_rezervare, ora, numar_persoane) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [nume, email, telefon, data_rezervare, ora, numar_persoane], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Eroare la salvarea rezervării.' });
        }
        sendConfirmationEmail(req.body, 'mancare');
        return res.status(201).json({ message: 'Cererea de masă trimisă pentru aprobare.', id: this.lastID });
    });
})

app.post('/api/admin/decizie', (req, res) => {
    const { id, tipRezervare, decizie } = req.body; //tipRezervare: 'cabana' sau 'mancare', decizie: 'confirmat' sau 'anulat'
    const tabel = tipRezervare === 'cabana' ? 'rezervari_cabana' : 'rezervari_mancare';
    const sql = `UPDATE ${tabel} SET status = ? WHERE id = ?`;
    db.run(sql, [decizie, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Rezervare nu a fost găsită.' });
        return res.json({ message: `Rezervare ${decizie}ă cu succes.` });
    })
});

app.get('/api/zile_ocupate', (req, res) => {
    const sql = `SELECT data_inceput, data_sfarsit, numar_persoane FROM rezervari_cabana WHERE status = 'confirmat'`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(rows);
    });
});

app.get('/api/admin/cabana', (req, res) => {
    db.all(`SELECT * FROM rezervari_cabana ORDER BY data_rezervare DESC`, [], (err, rows) => res.json(rows));
});
app.get('/api/admin/mancare', (req, res) => {
    db.all(`SELECT * FROM rezervari_mancare ORDER BY data_comanda DESC`, [], (err, rows) => res.json(rows));
});

app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});