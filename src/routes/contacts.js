const express = require('express');
const ContactController = require('../controllers/ContactController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', ContactController.list);
router.get('/filters', ContactController.getFilterOptions);
router.post('/', ContactController.create);
router.get('/:id', ContactController.getById);
router.put('/:id', ContactController.update);
router.delete('/:id', ContactController.remove);

module.exports = router;
