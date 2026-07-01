const db = require('../db');

function initializeTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS cabin_reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    adults INTEGER NOT NULL,
                    pets INTEGER,
                    rooms_needed INTEGER,
                    wants_meal INTEGER DEFAULT 0,
                    wants_hottub INTEGER DEFAULT 0,
                    newsletter INTEGER DEFAULT 0,
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
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    reservation_date TEXT NOT NULL,
                    adults INTEGER NOT NULL,
                    pets INTEGER,
                    wants_cabin INTEGER DEFAULT 0,
                    newsletter INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS reservation_drafts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reservation_type TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    current_step INTEGER NOT NULL DEFAULT 1,
                    form_data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL
                )
            `, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function migrateReservationDraftsSchema() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reservation_drafts'", (err, row) => {
                if (err) {
                    return reject(err);
                }

                if (!row) {
                    return db.run(`
                        CREATE TABLE reservation_drafts (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            reservation_type TEXT NOT NULL,
                            email TEXT,
                            phone TEXT,
                            current_step INTEGER NOT NULL DEFAULT 1,
                            form_data TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            expires_at TIMESTAMP NOT NULL
                        )
                    `, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                }

                db.all("PRAGMA table_info(reservation_drafts)", (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    const emailColumn = rows.find(col => col.name === 'email');
                    const phoneColumn = rows.find(col => col.name === 'phone');

                    if (emailColumn && !emailColumn.notnull && phoneColumn && !phoneColumn.notnull) {
                        return resolve();
                    }

                    db.run('BEGIN TRANSACTION', (err) => {
                        if (err) return reject(err);
                        db.run(`
                        CREATE TABLE reservation_drafts_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            reservation_type TEXT NOT NULL,
                            email TEXT,
                            phone TEXT,
                            current_step INTEGER NOT NULL DEFAULT 1,
                            form_data TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            expires_at TIMESTAMP NOT NULL
                        )
                    `, (err) => {
                            if (err) {
                                return db.run('ROLLBACK', () => reject(err));
                            }
                            db.run(`
                            INSERT INTO reservation_drafts_new
                            (id, reservation_type, email, phone, current_step, form_data, created_at, updated_at, expires_at)
                            SELECT id, reservation_type, email, phone, current_step, form_data, created_at, updated_at, expires_at
                            FROM reservation_drafts
                        `, (err) => {
                                if (err) {
                                    return db.run('ROLLBACK', () => reject(err));
                                }
                                db.run('DROP TABLE reservation_drafts', (err) => {
                                    if (err) {
                                        return db.run('ROLLBACK', () => reject(err));
                                    }
                                    db.run('ALTER TABLE reservation_drafts_new RENAME TO reservation_drafts', (err) => {
                                        if (err) {
                                            return db.run('ROLLBACK', () => reject(err));
                                        }

                                        db.run('COMMIT', (err) => {
                                            if (err) return reject(err);
                                            console.log('Database migration completed successfully');
                                            resolve();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports = { initializeTables, migrateReservationDraftsSchema };
