const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

require('./db');
require('./jobs/cronJobs');

//Import modular routes
const adminRoutes = require('./routes/adminRoutes');
const accomodationRoutes = require('./routes/accomodationRoutes');
const mealRoutes = require('./routes/mealRoutes');
// const draftRoutes = require('./routes/draftRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/flatpickr', express.static('node_modules/flatpickr/dist'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/accomodation', accomodationRoutes);
app.use('/api/meal', mealRoutes);
// app.use('/api/draft', draftRoutes);
app.use('/', pageRoutes);

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

app.listen(port, () => {
    console.log(`Serverul rulează pe portul ${port}`);
});
