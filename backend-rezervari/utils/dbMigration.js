const db = require('../db');

/**
 * Migrate database schema to allow NULL values for email and phone in reservation_drafts table
 * This fixes the issue where anonymous drafts (without email/phone) fail to save
 */
function migrateReservationDraftsSchema() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Check if email column is NOT NULL
            db.all("PRAGMA table_info(reservation_drafts)", (err, rows) => {
                if (err) {
                    return reject(err);
                }

                const emailColumn = rows.find(col => col.name === 'email');
                const phoneColumn = rows.find(col => col.name === 'phone');

                // If both email and phone already allow NULL, no migration needed
                if (emailColumn && !emailColumn.notnull && phoneColumn && !phoneColumn.notnull) {
                    console.log('Database schema is already correct - email and phone allow NULL values');
                    return resolve();
                }

                console.log('Migrating reservation_drafts table to allow NULL email and phone...');

                // SQLite doesn't support direct ALTER COLUMN, so we need to recreate the table
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);

                    // Create new table with correct schema
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

                        // Copy data from old table to new table
                        db.run(`
                            INSERT INTO reservation_drafts_new
                            (id, reservation_type, email, phone, current_step, form_data, created_at, updated_at, expires_at)
                            SELECT id, reservation_type, email, phone, current_step, form_data, created_at, updated_at, expires_at
                            FROM reservation_drafts
                        `, (err) => {
                            if (err) {
                                return db.run('ROLLBACK', () => reject(err));
                            }

                            // Drop old table
                            db.run('DROP TABLE reservation_drafts', (err) => {
                                if (err) {
                                    return db.run('ROLLBACK', () => reject(err));
                                }

                                // Rename new table
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
}

module.exports = { migrateReservationDraftsSchema };
