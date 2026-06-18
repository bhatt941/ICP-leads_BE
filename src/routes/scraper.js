const express = require('express');
const ScraperController = require('../controllers/ScraperController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/sessions', ScraperController.list);
router.get('/progress/stream', ScraperController.streamProgress);
router.post('/start', ScraperController.start);
router.post('/pause', ScraperController.pause);
router.post('/resume', ScraperController.resume);
router.post('/stop', ScraperController.stop);
router.delete('/clear-all', ScraperController.clearAll);
router.delete('/sessions/:id', ScraperController.remove);
router.get('/status/:sessionId?', ScraperController.status);

module.exports = router;
