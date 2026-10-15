import { useCallback, useMemo, useRef, useState } from 'react';
import ToastContext from './ToastContext.js';

const TOAST_DURATION_MS = 4000;

// App-wide notifications: showToast({ type: 'success' | 'error', message })
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'success', message }) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <span>{toast.message}</span>
            <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
