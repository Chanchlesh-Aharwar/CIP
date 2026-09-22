import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const toast = {
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    info: (m) => addToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, maxWidth: '90vw' }}>
        {toasts.map((t) => (
          <div key={t.id} className="liquid-glass-strong" style={{ padding: '0.7rem 1rem', color: t.type === 'error' ? '#991B1B' : t.type === 'success' ? '#065F46' : '#334155', borderLeft: `3px solid ${t.type === 'success' ? '#10B981' : t.type === 'error' ? '#EF4444' : '#6366F1'}`, fontSize: 14, minWidth: 260 }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
