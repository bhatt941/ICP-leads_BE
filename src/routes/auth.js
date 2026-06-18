const express = require('express');
const AuthController = require('../controllers/AuthController');
const authenticate = require('../middlewares/authenticate');
const { authLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const authValidators = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, authValidators.register, validate, AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/login', authLimiter, authValidators.login, validate, AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/refresh', AuthController.refreshToken);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', authValidators.resetPassword, validate, AuthController.resetPassword);

module.exports = router;
