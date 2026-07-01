const db = require('../db');

const mealModel = {
    checkAvailability: async (date) => {
        return new Promise((resolve, reject) => {
            const sql = `
            SELECT adults
            FROM meal_reservations
            WHERE status = 'confirmed'
            AND reservation_date = ?`;

            db.get(sql, [date], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.adults : 0);
                }
            });
        });
    },

    createReservation: async (reservationData) => {
        return new Promise((resolve, reject) => {
            const sqlInsert = `
            INSERT INTO meal_reservations
            (first_name, last_name, email, phone, reservation_date, adults, pets, wants_cabin, newsletter, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                reservationData.first_name,
                reservationData.last_name,
                reservationData.email,
                reservationData.phone,
                reservationData.reservation_date,
                reservationData.adults,
                reservationData.pets || 0,
                reservationData.wants_cabin ? 1 : 0,
                reservationData.newsletter ? 1 : 0,
                reservationData.created_at || new Date().toISOString(),
                reservationData.updated_at || new Date().toISOString()
            ];

            db.run(sqlInsert, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },

    getReservedDates: async () => {
        return new Promise((resolve, reject) => {
            const sql = `
            SELECT reservation_date, adults, pets
            FROM meal_reservations
            WHERE status = 'confirmed'`;

            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }
};

module.exports = mealModel;