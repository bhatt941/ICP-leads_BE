const express = require('express');
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', companyController.listCompanies);
router.post('/search', companyController.searchCompanies);
router.get('/:id', companyController.getCompany);

module.exports = router;
