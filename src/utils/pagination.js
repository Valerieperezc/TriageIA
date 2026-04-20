/**
 * @template T
 * @param {T[]} items
 * @param {number} page 1-based
 * @param {number} pageSize
 */
export function paginateSlice(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNum = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (pageNum - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  return {
    pageNum,
    totalPages,
    rows: items.slice(start, start + pageSize),
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: end,
    total,
  };
}
