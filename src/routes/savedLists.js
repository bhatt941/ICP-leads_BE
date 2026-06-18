const express = require('express');
const SavedListController = require('../controllers/SavedListController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.post('/', SavedListController.create);
router.get('/', SavedListController.list);
router.get('/:id', SavedListController.getById);
router.put('/:id', SavedListController.update);
router.delete('/:id', SavedListController.remove);
router.post('/:id/companies', SavedListController.addCompany);
router.delete('/:id/companies/:companyId', SavedListController.removeCompany);

module.exports = router;
