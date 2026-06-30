const { getLanguage, t, isValidEmail, isValidPhoneNumber, sanitizeText } = require('../utils/helpers');
const { sendDraftReminderEmail } = require('../utils/mailer');
const draftModel = require('../models/draftModel');


const handleGetDraft = async (req, res) => {
    const lang = getLanguage(req);
    const { email, phone, reservation_type } = req.query;

    if (email && !isValidEmail(email)) return res.status(400).json({ error: t('invalid_email', lang) });
    if (phone && !isValidPhoneNumber(phone)) return res.status(400).json({ error: t('invalid_telefon', lang) });
    if (!['mancare', 'cabana'].includes(reservation_type)) return res.status(400).json({ error: t('invalid_type', lang) });

    try {
        const draft = await draftModel.getActiveDraftByDetails(email || '', phone || '', reservation_type);

        if (draft) {
            return res.json({
                found: true,
                draft: {
                    id: draft.id,
                    current_step: draft.current_step,
                    form_data: JSON.parse(draft.form_data),
                    created_at: draft.created_at,
                    updated_at: draft.updated_at
                }
            });
        }
        return res.json({ found: false });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: t('data_error', lang) });
    }
};

const handleDeleteDraft = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    if (!id || isNaN(id)) return res.status(400).json({ error: t('invalid_id', lang) });

    try {
        const changes = await draftModel.deleteDraft(id);
        if (changes === 0) return res.status(404).json({ error: t('not_found', lang) });

        return res.json({ success: true, message: 'Draft deleted successfully.' });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: t('update_error', lang) });
    }
};

const handleSendReminder = async (req, res) => {
    const resumeLink = `${BASE_URL}?resume_draft=${draft.id}&email=${encodeURIComponent(draft.email)}&phone=${encodeURIComponent(draft.phone)}`;
    await sendDraftReminderEmail(draft, clientName, reservationType, resumeLink);
};

const handleMarkCompleted = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    if (!id || isNaN(id)) return res.status(400).json({ error: t('invalid_id', lang) });

    try {
        const changes = await draftModel.deleteDraft(id);
        if (changes === 0) return res.status(404).json({ error: t('not_found', lang) });

        return res.json({ success: true, message: 'Draft marked as completed and removed.' });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: t('update_error', lang) });
    }
};

module.exports = {
    handleGetDraft,
    handleDeleteDraft,
    handleSendReminder,
    handleMarkCompleted
};