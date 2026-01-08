const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');

router.get('/profile', auth.required, getProfile);
router.put('/profile', auth.required, updateProfile);

module.exports = router;
