const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/budgetController');
const router = express.Router();
router.use(protect);
router.get('/', controller.get);
router.put('/', controller.save);
module.exports = router;
