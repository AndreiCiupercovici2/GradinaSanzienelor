const db = require('../db');

function initializeTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS cabin_reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    arrival_time TEXT,
                    adults INTEGER NOT NULL,
                    pets TEXT,
                    rooms_needed INTEGER,
                    wants_meal BOOLEAN DEFAULT 0,
                    wants_hottub BOOLEAN DEFAULT 0,
                    newsletter BOOLEAN DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS meal_reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT NOT NULL,
                    reservation_date TEXT NOT NULL,
                    reservation_time TEXT NOT NULL,
                    adults INTEGER NOT NULL,
                    pets TEXT,
                    wants_cabin BOOLEAN DEFAULT 0,
                    cabin_start_date DATE NULL,
                    cabin_end_date DATE NULL,
                    newsletter BOOLEAN DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
            });
            db.run(`
                CREATE TABLE IF NOT EXISTS blocked_dates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
            });
        });
    });
}

module.exports = { initializeTables };
