const db = require('../db');

console.log('Starting cron jobs...');

// Scheduled cleanup job for expired drafts (runs every hour)
function startCronJobs() {
    try {
        console.log('Cron jobs initialized.');

        setInterval(() => {
            try {
                db.run(`DELETE FROM reservation_drafts WHERE expires_at <= CURRENT_TIMESTAMP`, function (err) {
                    if (err) {
                        console.error('Error during cron job execution:', err);
                    } else if (this.changes > 0) {
                        console.log(`Deleted ${this.changes} expired drafts.`);
                    }
                });
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }
        }, 60 * 60 * 1000); // Run every hour
    } catch (dbErr) {
        console.error('Error starting cron jobs:', dbErr);
    }
}

startCronJobs();