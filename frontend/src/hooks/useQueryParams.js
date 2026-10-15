import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// Keeps list state (filters, sorting, page) in the URL so it survives reloads and can be shared.
// `defaults` must be a stable object (e.g. a module-level constant). Values are strings, as in the URL.
// Setting a value to its default, '', null or undefined removes it from the URL.
const useQueryParams = (defaults) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => ({ ...defaults, ...Object.fromEntries(searchParams) }), [defaults, searchParams]);

  const updateQuery = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            const isDefault = defaults[key] !== undefined && String(value) === String(defaults[key]);
            if (value === undefined || value === null || value === '' || isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [defaults, setSearchParams],
  );

  return [query, updateQuery];
};

export default useQueryParams;
