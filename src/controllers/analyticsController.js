const AnalyticsService = require('../services/AnalyticsService');
const response = require('../utils/response');

async function overview(_req, res) {
  try {
    return response.success(res, await AnalyticsService.getOverview(), 'Analytics overview retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function hiring(_req, res) {
  try {
    return response.success(res, await AnalyticsService.getHiringAnalytics(), 'Hiring analytics retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function industries(_req, res) {
  try {
    return response.success(res, await AnalyticsService.getIndustryBreakdown(), 'Industry breakdown retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function leadScores(_req, res) {
  try {
    return response.success(res, await AnalyticsService.getLeadScoreDistribution(), 'Lead score distribution retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  hiring,
  industries,
  leadScores,
  overview
};
