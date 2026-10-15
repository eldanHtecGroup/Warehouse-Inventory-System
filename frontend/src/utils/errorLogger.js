// Single place where client-side errors are logged; swap console for a reporting service here.
export const logError = (error, context = {}) => {
  console.error('[app error]', { message: error?.message ?? String(error), ...context }, error);
};

// Passed to createRoot: errors caught by an ErrorBoundary and errors that escape every boundary
export const rootErrorHandlers = {
  onCaughtError: (error, info) => logError(error, { source: 'react', componentStack: info?.componentStack }),
  onUncaughtError: (error, info) =>
    logError(error, { source: 'react-uncaught', componentStack: info?.componentStack }),
};

// Errors outside React (event handlers, timers, unhandled promise rejections).
// Returns a function that removes the listeners again.
export const installGlobalErrorHandlers = (target = window) => {
  const onError = (event) => logError(event.error ?? event.message, { source: 'window.error' });
  const onRejection = (event) => logError(event.reason, { source: 'unhandledrejection' });

  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);

  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
};
