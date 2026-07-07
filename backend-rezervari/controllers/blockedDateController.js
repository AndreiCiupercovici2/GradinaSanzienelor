const BlockedDate = require('../models/blockedDateModel');

const blockedDateController = {
    blockDate: (req, res) => {
        const { type, start_date, end_date, reason } = req.body;
        BlockedDate.create({ type, start_date, end_date, reason }, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to block date' });
            }
            return res.status(200).json({ message: 'Date blocked successfully' });
        });
    },

    getBlockedDates: (req, res) => {
        BlockedDate.getAll((err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to retrieve blocked dates' });
            }
            return res.status(200).json(rows);
        });
    }
}

module.exports = blockedDateController;