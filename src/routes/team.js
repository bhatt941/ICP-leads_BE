const express = require('express');
const TeamController = require('../controllers/TeamController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', TeamController.list);
router.post('/invite', TeamController.invite);
router.post('/accept', TeamController.accept);
router.patch('/:userId/role', TeamController.updateRole);
router.delete('/:userId', TeamController.remove);
router.get('/:orgId', TeamController.list);
router.post('/:orgId/invite', TeamController.invite);

module.exports = router;
