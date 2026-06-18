const BaseRepository = require('./BaseRepository');
const CompanyRepository = require('./CompanyRepository');
const ContactRepository = require('./ContactRepository');
const JobRepository = require('./JobRepository');
const UserRepository = require('./UserRepository');
const { LeadScore, FilterOption, Audit } = require('../models');

module.exports = {
  BaseRepository,
  CompanyRepository: new CompanyRepository(),
  ContactRepository: new ContactRepository(),
  JobRepository: new JobRepository(),
  LeadScoreRepository: new BaseRepository(LeadScore),
  UserRepository: new UserRepository(),
  FilterOptionRepository: new BaseRepository(FilterOption),
  AuditRepository: new BaseRepository(Audit)
};
