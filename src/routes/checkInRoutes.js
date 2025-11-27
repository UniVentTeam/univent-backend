const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {scan} = require('../controllers/checkInController');
const requireRole = require("../middlewares/roleMiddleware");


router.post('/scan', auth.required,requireRole("ORGANIZER"), scan);

module.exports = router;
