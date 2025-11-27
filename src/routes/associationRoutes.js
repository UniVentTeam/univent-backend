const express = require('express');
const router = express.Router();
const { getAll, getOne,create} = require('../controllers/associationController');
const auth = require('../middlewares/authMiddleware');

router.post('/',auth.required, create);
router.get('/', getAll);
router.get('/:id', getOne);

module.exports = router;
