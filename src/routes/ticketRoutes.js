const express = require('express');
const router = express.Router();

const {joinEvent, getMyTickets, getTicketById} = require('../controllers/ticketController');
const auth = require('../middlewares/authMiddleware');
const requireRole = require("../middlewares/roleMiddleware");


router.post('/', auth.required,requireRole("STUDENT"), joinEvent);
router.get('/', auth.required, getMyTickets);
router.get('/:id', auth.required, getTicketById);
module.exports = router;
