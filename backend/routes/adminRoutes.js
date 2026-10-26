const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/adminController');
const router = express.Router();
router.use(protect, adminOnly);
router.get('/overview', controller.overview);
router.post('/users', controller.createUser);
router.delete('/users/:id', controller.deleteUser);
module.exports = router;
