import { useCallback, useEffect, useState } from 'react';

// Runs an async request on mount, exposing { data, error, isLoading, refetch }.
// `requestFn` receives { signal } so in-flight requests are aborted on unmount/refetch.
// Pass a stable function (module-level or useCallback) to avoid refetch loops.
const useFetch = (requestFn) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    requestFn({ signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [requestFn, reloadKey]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  return { data, error, isLoading, refetch };
};

export default useFetch;
