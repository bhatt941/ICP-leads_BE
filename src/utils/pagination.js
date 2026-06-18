function parsePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const sort = query.sort || 'createdAt';
  const order = String(query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  return { page, limit, sort, order };
}

function buildPaginationMeta(total, page, limit) {
  const totalRecords = Number(total) || 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return {
    totalRecords,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

module.exports = {
  buildPaginationMeta,
  parsePagination
};
