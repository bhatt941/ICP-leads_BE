const express = require('express');
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', contactController.listContacts);
router.get('/:id', contactController.getContact);

module.exports = router;
