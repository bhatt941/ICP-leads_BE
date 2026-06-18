const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);

module.exports = router;
