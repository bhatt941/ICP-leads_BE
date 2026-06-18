const express = require('express');
const CompanyController = require('../controllers/CompanyController');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const companyValidators = require('../validators/companyValidators');

const router = express.Router();

router.use(authenticate);
router.get('/', CompanyController.list);
router.post('/search', CompanyController.search);
router.get('/export', CompanyController.exportCompanies);
router.post('/bulk', CompanyController.bulk);
router.post('/', companyValidators.createCompany, validate, CompanyController.create);
router.get('/:id', CompanyController.getById);
router.put('/:id', companyValidators.updateCompany, validate, CompanyController.update);
router.delete('/:id', CompanyController.remove);
router.get('/apollo/:id', CompanyController.getApolloCompany);

module.exports = router;
