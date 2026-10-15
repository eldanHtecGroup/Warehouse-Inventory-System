import { useCallback, useEffect, useMemo, useState } from 'react';

// Runs an async request whenever `requestFn` changes, exposing { data, error, isLoading, refetch }.
// `requestFn` receives { signal } so in-flight requests are aborted on unmount or when superseded.
// Pass a stable function (module-level or useCallback) to avoid refetch loops.
// The previous data is kept while a new request is loading, so lists don't flicker.
const useFetch = (requestFn) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ data: null, error: null, settledFor: null });

  // Identifies the current request; isLoading is true until a result for it arrives
  const requestId = useMemo(() => ({ requestFn, reloadKey }), [requestFn, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();

    requestFn({ signal: controller.signal }).then(
      (data) => setResult({ data, error: null, settledFor: requestId }),
      (error) => {
        if (!controller.signal.aborted) setResult((prev) => ({ ...prev, error, settledFor: requestId }));
      },
    );

    return () => controller.abort();
  }, [requestFn, requestId]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  const isLoading = result.settledFor !== requestId;

  return { data: result.data, error: isLoading ? null : result.error, isLoading, refetch };
};

export default useFetch;
