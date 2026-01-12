const express = require('express');
const router = express.Router();
const { getAll, getOne, create, getMine } = require('../controllers/associationController');
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.post('/', auth.required, requireRole('ORGANIZER', 'ADMIN'), create);
router.get('/', getAll);
router.get('/mine', auth.required, getMine);
router.get('/:id', getOne);

module.exports = router;
