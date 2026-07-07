const db = require('../db');

const BlockedDate = {
    create: (data, callback) => {
        const sql = `INSERT INTO blocked_dates (type, start_date, end_date, reason) VALUES (?, ?, ?, ?)`;
        db.run(sql, [data.type, data.start_date, data.end_date, data.reason], callback);
    },
    getAll: (callback) => {
        db.all(`SELECT * FROM blocked_dates`, [], callback);
    },
    delete: (id, callback) => {
        db.run(`DELETE FROM blocked_dates WHERE id = ?`, [id], callback);
    }
};

module.exports = BlockedDate;