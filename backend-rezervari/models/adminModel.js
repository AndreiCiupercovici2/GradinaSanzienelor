const db = require('../db');

const AdminModel = {
    getAllCabinReservations: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM cabin_reservations ORDER BY start_date DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    },
    
    getAllMealReservations: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM meal_reservations ORDER BY reservation_date DESC`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    },

    getActiveDrafts: () => {
        return new Promise((resolve, reject) => {
            const sql = `
            SELECT id, reservation_type, email, phone, curent_step, created_at, updated_at
            FROM reservation_drafts
            WHERE expires_at > CURRENT_TIMESTAMP
            ORDER BY updated_at DESC`;

            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    },

    updateReservationStatus: (table, id, newStatus) => {
        return new Promise((resolve, reject) => {
            const allowed = ['cabin_reservations', 'meal_reservations'];
            if (!allowed.includes(table)) {
                return reject(new Error('Invalid table'));
            }
            const sql = `UPDATE ${table} SET status = ? WHERE id = ?`;
            db.run(sql, [newStatus, id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }    
}

module.exports = AdminModel;