const express = require('express');
const router = express.Router();
const {getSystemReports} = require('../controllers/systemController');
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/reports', auth.required, requireRole('ADMIN'), getSystemReports);

module.exports = router;
