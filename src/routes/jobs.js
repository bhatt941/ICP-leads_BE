const express = require('express');
const JobController = require('../controllers/JobController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);
router.get('/', JobController.list);
router.post('/', JobController.create);
router.get('/:id', JobController.getById);
router.put('/:id', JobController.update);
router.delete('/:id', JobController.remove);
router.get('/apollo/:organization_id', JobController.getApolloJobs);

module.exports = router;
