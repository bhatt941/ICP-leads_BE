const express = require('express');
const OrganizationController = require('../controllers/OrganizationController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.post('/', OrganizationController.create);
router.get('/:id', OrganizationController.getById);
router.put('/:id', OrganizationController.update);
router.delete('/:id/members/:userId', OrganizationController.removeMember);
router.patch('/:id/members/:userId/role', OrganizationController.updateMemberRole);

module.exports = router;
