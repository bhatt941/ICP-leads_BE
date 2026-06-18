const express = require('express');
const SavedLeadController = require('../controllers/SavedLeadController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', SavedLeadController.list);
router.post('/', SavedLeadController.create);
router.put('/:id', SavedLeadController.update);
router.delete('/:id', SavedLeadController.remove);

module.exports = router;
