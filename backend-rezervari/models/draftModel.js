const db = require('../db');

const draftModel = {
    findDraftByContact: (email, phone, reservationType) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id FROM reservation_drafts
                WHERE email = ? AND phone = ? AND reservation_type = ?`;
            
            db.get(sql, [email, phone, reservationType], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    },

    findAnonymousDraft: (reservationType) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id FROM reservation_drafts
                WHERE (email IS NULL OR email = '')
                AND reservation_type = ?
                ORDER BY updated_at DESC
                LIMIT 1`;
                
            db.get(sql, [reservationType], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    },

    findFlexibleDraft: (email, phone, reservationType) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id FROM reservation_drafts
                WHERE (email = ? OR (? = '' AND (email IS NULL OR email = '')))
                AND (phone = ? OR (? = '' AND (phone IS NULL OR phone = '')))
                AND reservation_type = ?
                ORDER BY updated_at DESC LIMIT 1`;
                
            db.get(sql, [email, email, phone, phone, reservationType], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    },

    updateExistingDraft: (draftId, currentStep, formDataJson, email, phone, expiresAt) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE reservation_drafts
                SET current_step = ?, form_data = ?, email = ?, phone = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`;

            db.run(sql, [currentStep, formDataJson, email, phone, expiresAt, draftId], function (err) {
                if (err) return reject(err);
                resolve({ draftId: draftId, isNew: false });
            });
        });
    },

    insertNewDraft: (email, phone, reservationType, currentStep, formDataJson, expiresAt) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO reservation_drafts (email, phone, reservation_type, current_step, form_data, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)`;
                
            db.run(sql, [email, phone, reservationType, currentStep, formDataJson, expiresAt], function (err) {
                if (err) return reject(err);
                resolve({ draftId: this.lastID, isNew: true });
            });
        });
    },

    getActiveDraftByDetails: (email, phone, reservationType) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM reservation_drafts
                WHERE email = ? AND phone = ? AND reservation_type = ?
                AND expires_at > CURRENT_TIMESTAMP`;
            db.get(sql, [email, phone, reservationType], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    },

    getDraftById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM reservation_drafts WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    },

    deleteDraft: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM reservation_drafts WHERE id = ?`;
            db.run(sql, [id], function (err) {
                if (err) return reject(err);
                // this.changes returns the number of rows deleted
                resolve(this.changes); 
            });
        });
    }
};

module.exports = draftModel;