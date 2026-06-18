const express = require('express');
const SessionController = require('../controllers/SessionController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', SessionController.list);
router.delete('/:id', SessionController.revoke);

module.exports = router;
