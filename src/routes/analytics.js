const express = require('express');
const AnalyticsController = require('../controllers/AnalyticsController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/overview', AnalyticsController.overview);
router.get('/hiring', AnalyticsController.hiring);
router.get('/industries', AnalyticsController.industries);
router.get('/lead-scores', AnalyticsController.leadScores);

module.exports = router;
