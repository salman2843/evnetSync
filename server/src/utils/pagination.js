import httpError from './httpError.js';

// Optional pagination: a request without page/limit keeps returning every row,
// which preserves the existing API for the current client. When either value is
// sent, both are applied.
export const MAX_PAGE_SIZE = 100;

export function parsePagination(query = {}) {
  if (query.page === undefined && query.limit === undefined) return null;

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) throw httpError('Page must be 1 or greater');
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw httpError(`Limit must be between 1 and ${MAX_PAGE_SIZE}`);
  }

  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(total, { page, limit }) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}
