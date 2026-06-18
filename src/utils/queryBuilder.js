function csv(value) {
  if (!value) return undefined;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function regex(value) {
  return value ? new RegExp(String(value).trim(), 'i') : undefined;
}

function buildCompanyFilter(query) {
  const filter = {};
  if (query.industry) filter.industry = regex(query.industry);
  if (query.country) filter.country = regex(query.country);
  if (query.city) filter.city = regex(query.city);
  if (query.hiringStatus) filter.hiringStatus = query.hiringStatus;
  if (query.headcountMin || query.headcountMax) {
    filter.headcount = {};
    if (query.headcountMin) filter.headcount.$gte = Number(query.headcountMin);
    if (query.headcountMax) filter.headcount.$lte = Number(query.headcountMax);
  }
  const technologies = csv(query.technologyStack);
  if (technologies?.length) filter.technologyStack = { $in: technologies.map(regex) };
  if (query.keywords) {
    filter.$text = { $search: query.keywords };
  }
  return filter;
}

function buildContactFilter(query) {
  const filter = {};
  if (query.designation) filter.designation = regex(query.designation);
  if (query.department) filter.department = regex(query.department);
  if (query.seniority) filter.seniority = regex(query.seniority);
  if (query.location) filter.location = regex(query.location);
  if (query.keywords) filter.$text = { $search: query.keywords };
  return filter;
}

function buildJobFilter(query) {
  const filter = {};
  if (query.industry) filter.industry = regex(query.industry);
  if (query.location) filter.location = regex(query.location);
  if (query.department) filter.department = regex(query.department);
  if (query.workplaceType) filter.workplaceType = query.workplaceType;
  const skills = csv(query.requiredSkills);
  if (skills?.length) filter.requiredSkills = { $in: skills.map(regex) };
  if (query.keywords) filter.$text = { $search: query.keywords };
  return filter;
}

function pagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

module.exports = {
  buildCompanyFilter,
  buildContactFilter,
  buildJobFilter,
  pagination
};
