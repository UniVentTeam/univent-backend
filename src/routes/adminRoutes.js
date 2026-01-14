const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const { getAllUsers, updateUserRole } = require('../controllers/adminController');

router.get('/users', auth.required, auth.admin, getAllUsers);
router.patch('/users/:userId/role', auth.required, auth.admin, updateUserRole);

module.exports = router;
