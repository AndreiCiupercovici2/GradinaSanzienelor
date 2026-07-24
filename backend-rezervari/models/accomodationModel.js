const db = require('../db');

const accomodationModel = {
    checkAvailability: (startDate, endDate) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT adults
                FROM cabin_reservations
                WHERE status = 'confirmed'
                AND NOT (end_date <= ? OR start_date >= ?)`;

            db.get(sql, [startDate, endDate], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.adults : 0);
            });
        });
    },

    createReservation: ({first_name, last_name, email, phone, start_date, end_date, arrival_time, adults, pets, rooms_needed, wants_meal, wants_hottub, newsletter, created_at, updated_at}) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO cabin_reservations (
                    first_name, last_name, email, phone, start_date, end_date, arrival_time,
                    adults, pets, rooms_needed, wants_meal, wants_hottub, newsletter, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                first_name,
                last_name,
                email,
                phone,
                start_date,
                end_date,
                arrival_time,
                adults,
                pets,
                rooms_needed,
                wants_meal ? true : false,
                wants_hottub ? true : false,
                newsletter ? true : false,
                created_at || new Date().toISOString(),
                updated_at || new Date().toISOString()
            ];

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    cancelReservation: (id) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE cabin_reservations
                SET status = 'cancelled', updated_at = ?
                WHERE id = ?`;
                
            const params = [new Date().toISOString(), id];

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    getAvailability: () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT start_date, end_date, adults, pets
                FROM cabin_reservations
                WHERE status = 'confirmed'`;

            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
};

module.exports = accomodationModel;