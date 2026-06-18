const express = require('express');
const ApiKeyController = require('../controllers/ApiKeyController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.post('/', ApiKeyController.create);
router.get('/', ApiKeyController.list);
router.delete('/:id', ApiKeyController.revoke);

module.exports = router;
