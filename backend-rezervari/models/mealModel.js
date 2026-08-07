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

    createReservation: async ({first_name, last_name, email, phone, reservation_date, reservation_time, adults, pets, wants_cabin, newsletter, cabin_start_date, cabin_end_date, created_at, updated_at}) => {
        return new Promise((resolve, reject) => {
            const sqlInsert = `
            INSERT INTO meal_reservations
            (first_name, last_name, email, phone, reservation_date, reservation_time, adults, pets, wants_cabin, newsletter, cabin_start_date, cabin_end_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                first_name,
                last_name,
                email,
                phone,
                reservation_date,
                reservation_time,
                adults,
                pets,
                wants_cabin ? true : false,
                newsletter ? true : false,
                cabin_start_date,
                cabin_end_date,
                new Date().toISOString(),
                new Date().toISOString()
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

    cancelReservation: async (id) => {
        return new Promise((resolve, reject) => {
            const sqlUpdate = `
            UPDATE meal_reservations
            SET status = 'cancelled', updated_at = ?
            WHERE id = ?`;

            const params = [new Date().toISOString(), id];
            
            db.run(sqlUpdate, params, function(err) {
                if (err) reject(err);
                else resolve(this.changes);
                
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