const isEmpty = (value) => value === undefined || value === null || value === '';

// Builds "?a=1&b=2" from an object, skipping empty values. Returns '' when nothing is left.
export const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!isEmpty(value)) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

// Converts a <input type="date"> value (YYYY-MM-DD, local time) to an ISO timestamp
// at the start or end of that day, so date filters include the whole selected day.
export const dateInputToIso = (value, { endOfDay = false } = {}) => {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};
