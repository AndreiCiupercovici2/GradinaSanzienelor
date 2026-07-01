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

    createReservation: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO cabin_reservations (
                    first_name, last_name, email, phone, start_date, end_date,
                    adults, pets, rooms_needed, wants_meal, wants_hottub, newsletter, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                data.first_name,
                data.last_name,
                data.email,
                data.phone,
                data.start_date,
                data.end_date,
                data.adults,
                data.pets || 0,
                data.rooms_needed,
                data.wants_meal ? true : false,
                data.wants_hottub ? true : false,
                data.newsletter ? true : false,
                data.created_at || new Date().toISOString(),
                data.updated_at || new Date().toISOString()
            ];

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
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