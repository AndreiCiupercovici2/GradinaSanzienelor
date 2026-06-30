const getDbConnection = require('../db');

const db = require('../db');

const mealModel = {
    checkAvailability: async (date, mealType) => {
        return new Promise(async (resolve, reject) => {
            const sql = `
            SELECT adults FROM meal_reservations
            WHERE status = 'confirmed'
            AND NOT (start_date >= ?)`;

            db.getDbConnection(sql, [date], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.adults || 0 : 0);
                }
            });
        });
    },

    createReservation: async (reservationData) => {
        return new Promise(async (resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const sqlInsert = `
            INSERT INTO meal_reservations (first_name, last_name, email, phone, start_date, adults, wants_cabin, newsletter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                db.run(sqlInsert, [
                    reservationData.first_name,
                    reservationData.last_name,
                    reservationData.email,
                    reservationData.phone,
                    reservationData.start_date,
                    reservationData.adults,
                    reservationData.wants_cabin,
                    reservationData.newsletter
                ], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                    } 
                    const insertId = this.lastID;
                    db.run("COMMIT", (commitErr) => {
                        if (commitErr) {
                            db.run("ROLLBACK");
                            return reject(commitErr);
                        }
                        resolve(insertId);
                    });
                });
            });
        });
    },
    getReservedDates: async () => {
        return new Promise((resolve, reject) => {
            const sql = `
            SELECT start_date, adults
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
}

module.exports = mealModel;