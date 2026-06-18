const express = require('express');
const UserController = require('../controllers/UserController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/profile', UserController.getProfile);
router.patch('/profile', UserController.updateProfile);
router.delete('/account', UserController.deleteAccount);

module.exports = router;
