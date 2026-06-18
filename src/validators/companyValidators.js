const { body } = require('express-validator');

const createCompany = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('website').optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Website must be a valid URL'),
  body('linkedinCompanyUrl').optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage('LinkedIn URL must be a valid URL'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
  body('headcount').optional({ nullable: true }).isNumeric().withMessage('Headcount must be numeric'),
  body('foundedYear').optional({ nullable: true }).isInt({ min: 1700, max: new Date().getFullYear() }).withMessage('Founded year is invalid'),
  body('hiringStatus').optional().isIn(['active', 'inactive', 'unknown']).withMessage('Invalid hiring status'),
  body('leadGrade').optional().isIn(['A', 'B', 'C', 'D', 'unscored']).withMessage('Invalid lead grade')
];

const updateCompany = [
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('website').optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Website must be a valid URL'),
  body('linkedinCompanyUrl').optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage('LinkedIn URL must be a valid URL'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
  body('headcount').optional({ nullable: true }).isNumeric().withMessage('Headcount must be numeric'),
  body('foundedYear').optional({ nullable: true }).isInt({ min: 1700, max: new Date().getFullYear() }).withMessage('Founded year is invalid'),
  body('hiringStatus').optional().isIn(['active', 'inactive', 'unknown']).withMessage('Invalid hiring status'),
  body('leadGrade').optional().isIn(['A', 'B', 'C', 'D', 'unscored']).withMessage('Invalid lead grade')
];

module.exports = {
  createCompany,
  updateCompany
};
