const express = require('express');
const router = express.Router();
const DraftController = require('../controllers/draftController');

router.get('/draft', DraftController.handleGetDraft);
router.post('/draft', DraftController.handleSaveDraft);
router.delete('/draft/:id', DraftController.handleDeleteDraft);
router.post('/draft/:id/send-reminder', DraftController.handleSendReminder);
router.post('/draft/:id/mark-completed', DraftController.handleMarkCompleted);

module.exports = router;