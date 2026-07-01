const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database with synchronous API
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Run migrations on startup
        runMigrations();
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function runMigrations() {
    const { migrateReservationDraftsSchema } = require('./utils/dbMigration');
    migrateReservationDraftsSchema().catch((err) => {
        console.error('Migration error:', err);
    });
}

module.exports = db;