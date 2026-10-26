const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/authController');
const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', protect, controller.me);
module.exports = router;
