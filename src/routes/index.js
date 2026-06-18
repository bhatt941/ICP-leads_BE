const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const companiesRoutes = require('./companies');
const contactsRoutes = require('./contacts');
const jobsRoutes = require('./jobs');
const analyticsRoutes = require('./analytics');
const organizationsRoutes = require('./organizations');
const teamRoutes = require('./team');
const apiKeyRoutes = require('./apikeys');
const savedListRoutes = require('./savedLists');
const auditRoutes = require('./audit');
const sessionRoutes = require('./sessions');
const scraperRoutes = require('./scraper');
const savedLeadRoutes = require('./savedLeads');
const filtersRoutes = require('./filters');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/team', teamRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/saved-lists', savedListRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/sessions', sessionRoutes);
router.use('/scraper', scraperRoutes);
router.use('/saved-leads', savedLeadRoutes);
router.use('/filters', filtersRoutes);

module.exports = router;
