const express = require('express');
const AuditController = require('../controllers/AuditController');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.get('/', authorizeRoles('super_admin', 'org_owner', 'admin'), AuditController.list);

module.exports = router;
