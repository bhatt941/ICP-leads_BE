const { parsePagination } = require('../utils/pagination');

function getPagination(query = {}) {
  return parsePagination(query);
}

function getFilters(query = {}) {
  const { page, limit, sort, order, ...filters } = query;
  return filters;
}

module.exports = {
  getFilters,
  getPagination
};
