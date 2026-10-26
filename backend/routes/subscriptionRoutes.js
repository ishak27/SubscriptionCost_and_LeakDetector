const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/subscriptionController');
const router = express.Router();
router.use(protect);
router.route('/').post(controller.create).get(controller.list);
router.route('/:id').get(controller.getOne).put(controller.update).delete(controller.remove);
module.exports = router;
