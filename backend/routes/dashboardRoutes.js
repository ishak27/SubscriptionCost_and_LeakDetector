const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/dashboardController');
const router = express.Router();
router.get('/', protect, controller.getOverview);
module.exports = router;
