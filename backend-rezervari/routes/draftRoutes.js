const express = require('express');
const router = express.Router();
const DraftController = require('../controllers/draftController');

router.get('/', DraftController.handleGetDraft);
router.delete('/:id', DraftController.handleDeleteDraft);
router.post('/:id/send-reminder', DraftController.handleSendReminder);
router.post('/:id/mark-completed', DraftController.handleMarkCompleted);

module.exports = router;