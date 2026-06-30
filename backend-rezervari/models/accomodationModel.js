const db = require('../db'); // Assuming this exports your sqlite3 db instance

const accomodationModel = {
    checkAvailability: (startDate, endDate) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT SUM(adults + infants) AS total_guests
                FROM cabin_reservations
                WHERE status = 'confirmed'
                AND NOT (end_date <= ? OR start_date >= ?)`;

            // Use the standard sqlite3 .get method
            db.get(sql, [startDate, endDate], (err, row) => {
                if (err) reject(err);
                else resolve(row ? (row.total_guests || 0) : 0);
            });
        });
    },

    createReservation: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO cabin_reservations (
                    first_name, last_name, email, phone, start_date, end_date, 
                    adults, infants, pets, rooms_needed, wants_meal, wants_hottub, newsletter
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const params = [
                data.first_name, data.last_name, data.email, data.phone, 
                data.start_date, data.end_date, data.adults, data.infants, 
                data.pets, data.rooms_needed, 
                data.wants_meal ? 1 : 0, 
                data.wants_hottub ? 1 : 0, 
                data.newsletter ? 1 : 0
            ];

            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
};

module.exports = accomodationModel;