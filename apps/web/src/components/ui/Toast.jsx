'use client';

import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from './toast-context';

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const STYLES = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type, message, duration = 4000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]); // keep max 4
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const toast = {
    success: (msg, dur) => push('success', msg, dur),
    error: (msg, dur) => push('error', msg, dur ?? 6000),
    info: (msg, dur) => push('info', msg, dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${STYLES[t.type]}`}
                role="status"
              >
                {ICONS[t.type]}
                <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
