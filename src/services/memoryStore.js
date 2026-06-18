const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const env = require('../config/env');
const { classifyCompanySize, scoreLead } = require('./scoringService');

const store = {
  users: [],
  companies: [],
  contacts: [],
  jobs: [],
  searchHistory: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function includes(value, needle) {
  if (!needle) return true;
  return String(value || '').toLowerCase().includes(String(needle).toLowerCase());
}

function paginate(data, query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  const skip = (page - 1) * limit;
  return {
    data: clone(data.slice(skip, skip + limit)),
    page,
    limit,
    total: data.length
  };
}

async function createUser(payload) {
  if (store.users.some((user) => user.email === payload.email.toLowerCase())) {
    const error = new Error('Email already exists');
    error.code = 11000;
    throw error;
  }

  const user = {
    _id: randomUUID(),
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: await bcrypt.hash(payload.password, env.bcryptSaltRounds),
    role: payload.role || 'analyst',
    isActive: true,
    createdAt: now(),
    updatedAt: now()
  };
  store.users.push(user);
  const { passwordHash, ...safeUser } = user;
  return clone(safeUser);
}

async function findUserByEmailWithPassword(email) {
  return store.users.find((user) => user.email === String(email || '').toLowerCase());
}

async function findUserById(id) {
  const user = store.users.find((item) => item._id === id);
  if (!user) return undefined;
  const { passwordHash, ...safeUser } = user;
  return clone(safeUser);
}

async function listCompanies(query = {}) {
  let data = [...store.companies];
  if (query.industry) data = data.filter((item) => includes(item.industry, query.industry));
  if (query.country) data = data.filter((item) => includes(item.country, query.country));
  if (query.city) data = data.filter((item) => includes(item.city, query.city));
  if (query.hiringStatus) data = data.filter((item) => item.hiringStatus === query.hiringStatus);
  if (query.headcountMin) data = data.filter((item) => Number(item.headcount || 0) >= Number(query.headcountMin));
  if (query.headcountMax) data = data.filter((item) => Number(item.headcount || 0) <= Number(query.headcountMax));
  if (query.technologyStack) {
    const technologies = String(query.technologyStack).split(',').map((item) => item.trim().toLowerCase());
    data = data.filter((item) => (item.technologyStack || []).some((tech) => technologies.includes(String(tech).toLowerCase())));
  }
  if (query.keywords) {
    data = data.filter((item) =>
      [item.companyName, item.description, item.industry, item.city, item.country].some((value) => includes(value, query.keywords))
    );
  }
  data.sort((a, b) => (b.scores?.lead || 0) - (a.scores?.lead || 0));
  return paginate(data, query);
}

async function getCompanyById(id) {
  return clone(store.companies.find((item) => item._id === id));
}

async function upsertCompany(payload) {
  const index = store.companies.findIndex((item) =>
    payload.website ? item.website === payload.website : item.companyName === payload.companyName
  );
  const previous = index >= 0 ? store.companies[index] : {};
  const company = {
    _id: previous._id || randomUUID(),
    ...previous,
    ...payload,
    hiringStatus: payload.hiringStatus || previous.hiringStatus || 'unknown',
    sources: [...new Set([...(previous.sources || []), ...(payload.sources || [])])],
    scores: previous.scores || { hiringIntensity: 0, growth: 0, technologyAdoption: 0, lead: 0 },
    createdAt: previous.createdAt || now(),
    updatedAt: now()
  };
  if (index >= 0) store.companies[index] = company;
  else store.companies.push(company);
  return clone(company);
}

async function listContacts(query = {}) {
  let data = [...store.contacts];
  if (query.designation) data = data.filter((item) => includes(item.designation, query.designation));
  if (query.department) data = data.filter((item) => includes(item.department, query.department));
  if (query.seniority) data = data.filter((item) => includes(item.seniority, query.seniority));
  if (query.location) data = data.filter((item) => includes(item.location, query.location));
  if (query.keywords) {
    data = data.filter((item) => [item.name, item.designation, item.companyName, item.department].some((value) => includes(value, query.keywords)));
  }
  return paginate(data, query);
}

async function getContactById(id) {
  return clone(store.contacts.find((item) => item._id === id));
}

async function upsertContact(payload) {
  const index = store.contacts.findIndex((item) => item.linkedinUrl && item.linkedinUrl === payload.linkedinUrl);
  const previous = index >= 0 ? store.contacts[index] : {};
  const contact = { _id: previous._id || randomUUID(), ...previous, ...payload, createdAt: previous.createdAt || now(), updatedAt: now() };
  if (index >= 0) store.contacts[index] = contact;
  else store.contacts.push(contact);
  return clone(contact);
}

async function listJobs(query = {}) {
  let data = [...store.jobs];
  if (query.industry) data = data.filter((item) => includes(item.industry, query.industry));
  if (query.location) data = data.filter((item) => includes(item.location, query.location));
  if (query.department) data = data.filter((item) => includes(item.department, query.department));
  if (query.workplaceType) data = data.filter((item) => item.workplaceType === query.workplaceType);
  if (query.requiredSkills) {
    const skills = String(query.requiredSkills).split(',').map((item) => item.trim().toLowerCase());
    data = data.filter((item) => (item.requiredSkills || []).some((skill) => skills.includes(String(skill).toLowerCase())));
  }
  if (query.keywords) {
    data = data.filter((item) => [item.title, item.companyName, item.description, item.department].some((value) => includes(value, query.keywords)));
  }
  return paginate(data, query);
}

async function getJobById(id) {
  return clone(store.jobs.find((item) => item._id === id));
}

async function upsertJob(payload) {
  const index = store.jobs.findIndex((item) => item.jobUrl === payload.jobUrl);
  const previous = index >= 0 ? store.jobs[index] : {};
  const job = { _id: previous._id || randomUUID(), ...previous, ...payload, createdAt: previous.createdAt || now(), updatedAt: now() };
  if (index >= 0) store.jobs[index] = job;
  else store.jobs.push(job);
  return clone(job);
}

async function rescoreCompany(companyId) {
  const index = store.companies.findIndex((item) => item._id === companyId);
  if (index < 0) return undefined;
  const jobs = store.jobs.filter((job) => job.company === companyId && job.active !== false);
  store.companies[index].hiringStatus = jobs.length ? 'active' : 'inactive';
  store.companies[index].scores = scoreLead(store.companies[index], jobs);
  store.companies[index].updatedAt = now();
  return clone(store.companies[index]);
}

async function addSearchHistory(payload) {
  store.searchHistory.push({ _id: randomUUID(), ...payload, createdAt: now(), updatedAt: now() });
}

async function analyticsOverview() {
  return {
    companies: store.companies.length,
    contacts: store.contacts.length,
    jobs: store.jobs.length,
    activeHiring: store.companies.filter((company) => company.hiringStatus === 'active').length,
    topLeads: clone([...store.companies].sort((a, b) => (b.scores?.lead || 0) - (a.scores?.lead || 0)).slice(0, 10))
  };
}

async function analyticsHiring() {
  const group = (field) =>
    Object.values(
      store.jobs.reduce((acc, job) => {
        const key = job[field] || 'Unknown';
        acc[key] = acc[key] || { _id: key, count: 0 };
        acc[key].count += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.count - a.count);

  return {
    byDepartment: group('department'),
    byWorkplaceType: group('workplaceType'),
    recentJobs: clone([...store.jobs].sort((a, b) => String(b.discoveredAt || '').localeCompare(String(a.discoveredAt || ''))).slice(0, 25))
  };
}

async function analyticsIndustries() {
  const grouped = store.companies.reduce((acc, company) => {
    const key = company.industry || 'Unknown';
    acc[key] = acc[key] || { _id: key, companies: 0, totalLeadScore: 0, totalHiringIntensity: 0 };
    acc[key].companies += 1;
    acc[key].totalLeadScore += company.scores?.lead || 0;
    acc[key].totalHiringIntensity += company.scores?.hiringIntensity || 0;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((item) => ({
      _id: item._id,
      companies: item.companies,
      avgLeadScore: item.totalLeadScore / item.companies,
      avgHiringIntensity: item.totalHiringIntensity / item.companies
    }))
    .sort((a, b) => b.companies - a.companies);
}

module.exports = {
  addSearchHistory,
  analyticsHiring,
  analyticsIndustries,
  analyticsOverview,
  createUser,
  findUserByEmailWithPassword,
  findUserById,
  getCompanyById,
  getContactById,
  getJobById,
  listCompanies,
  listContacts,
  listJobs,
  rescoreCompany,
  upsertCompany,
  upsertContact,
  upsertJob
};
