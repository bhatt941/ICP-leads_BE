const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/overview', analyticsController.overview);
router.get('/hiring', analyticsController.hiring);
router.get('/industries', analyticsController.industries);

module.exports = router;
