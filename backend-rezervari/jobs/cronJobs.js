const { getDbConnection } = require('../db');
const { db } = getDbConnection();

console.log('Starting cron jobs...');

// Scheduled cleanup job for expired drafts (runs every hour)
async function startCronJobs() {
    try {
        const db = await getDbConnection();
        console.log('Connected to the database for cron jobs.');

        setInterval(async () => {
            try {
                const result = await db.run(`DELETE FROM reservation_drafts WHERE expires_at <= CURRENT_TIMESTAMP`);
                if (result.changes > 0) {
                    console.log(`Deleted ${result.changes} expired drafts.`);
                }
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }
        }, 60 * 60 * 1000); // Run every hour
    } catch (dbErr) {
        console.error('Error starting cron jobs:', dbErr);
    }
}

startCronJobs();