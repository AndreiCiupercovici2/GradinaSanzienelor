const { getDbConnection } = require('../db');

const db = require('../db');

const accomodationModel = {
    checkAvailability: async (startDate, endDate) => {
        return new Promise(async (resolve, reject) => {
            const sql = `
            SELECT SUM(adults + infants) AS total_guests
            FROM cabin_reservations
            WHERE status = 'confirmed'
            AND NOT (end_date <= ? OR start_date >= ?)`;

            db.getDbConnection(sql, [startDate, endDate], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.total_guests || 0 : 0);
                }
            });
        });
    },

    createReservation: async (reservationData) => {
        return new Promise(async (resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const sqlInsert = `
            INSERT INTO cabin_reservations (first_name, last_name, email, phone, start_date, end_date, no_of_people, adults, infants, pets, rooms_needed, wants_meal, wants_hottub, newsletter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                db.run(sqlInsert, [
                    reservationData.first_name,
                    reservationData.last_name,
                    reservationData.email,
                    reservationData.phone,
                    reservationData.start_date,
                    reservationData.end_date,
                    reservationData.no_of_people,
                    reservationData.adults,
                    reservationData.infants,
                    reservationData.pets,
                    reservationData.rooms_needed,
                    reservationData.wants_meal ? 1 : 0,
                    reservationData.wants_hottub ? 1 : 0,
                    reservationData.newsletter ? 1 : 0
                ], function (err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return reject(err);
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

    getReservedDates: () => {
        return new Promise((resolve, reject) => {
            const sql = `
            SELECT start_date, end_date, adults
            FROM cabin_reservations
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

module.exports = accomodationModel;