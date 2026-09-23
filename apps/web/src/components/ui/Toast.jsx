import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ─── Toast Context ───

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// ─── Toast Types ───

const toastTypes = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/50',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
};

// ─── Toast Item Component ───

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const config = toastTypes[toast.type] || toastTypes.info;
  const Icon = config.icon;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        ${config.bgColor} ${config.borderColor}
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {toast.title && <p className="text-sm font-medium text-foreground">{toast.title}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{toast.message}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {toast.action && (
        <div className="border-t border-border px-4 py-3 bg-background/50">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:text-primary/80"
            onClick={() => {
              toast.action.onClick();
              handleClose();
            }}
          >
            {toast.action.label}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toast Provider ───

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      return addToast({
        message,
        type: options.type || 'info',
        title: options.title,
        duration: options.duration,
        action: options.action,
      });
    },
    [addToast]
  );

  const toastSuccess = useCallback(
    (message, options = {}) => {
      return addToast({
        message,
        type: 'success',
        title: options.title,
        duration: options.duration || 5000,
        action: options.action,
      });
    },
    [addToast]
  );

  const toastError = useCallback(
    (message, options = {}) => {
      return addToast({
        message,
        type: 'error',
        title: options.title,
        duration: options.duration || 7000,
        action: options.action,
      });
    },
    [addToast]
  );

  const toastWarning = useCallback(
    (message, options = {}) => {
      return addToast({
        message,
        type: 'warning',
        title: options.title,
        duration: options.duration || 6000,
        action: options.action,
      });
    },
    [addToast]
  );

  const toastInfo = useCallback(
    (message, options = {}) => {
      return addToast({
        message,
        type: 'info',
        title: options.title,
        duration: options.duration || 5000,
        action: options.action,
      });
    },
    [addToast]
  );

  const toastDismiss = useCallback(
    (id) => {
      removeToast(id);
    },
    [removeToast]
  );

  const toastDismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // FIX: Return an object with methods instead of a function with properties
  // This avoids React Compiler's immutability check
  const toastApi = React.useMemo(
    () => ({
      toast,
      success: toastSuccess,
      error: toastError,
      warning: toastWarning,
      info: toastInfo,
      dismiss: toastDismiss,
      dismissAll: toastDismissAll,
    }),
    [toast, toastSuccess, toastError, toastWarning, toastInfo, toastDismiss, toastDismissAll]
  );

  const contextValue = {
    toast: toastApi,
    toasts,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ─── Toast Container (for direct rendering) ───

export function ToastContainer({ toasts, onRemove, position = 'top-right' }) {
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };

  return createPortal(
    <div
      className={`
        pointer-events-none fixed z-[100] flex flex-col gap-2 p-4 sm:p-6
        ${positionClasses[position] || positionClasses['top-right']}
      `}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

// ─── Standalone Toast Hook (alternative) ───

let globalAddToast = null;

export function toast(message, options = {}) {
  if (globalAddToast) {
    return globalAddToast(message, options);
  }
  console.warn('Toast: ToastProvider not mounted');
  return null;
}

toast.success = (message, options = {}) => {
  if (globalAddToast) {
    return globalAddToast(message, { ...options, type: 'success' });
  }
  console.warn('Toast: ToastProvider not mounted');
  return null;
};

toast.error = (message, options = {}) => {
  if (globalAddToast) {
    return globalAddToast(message, { ...options, type: 'error' });
  }
  console.warn('Toast: ToastProvider not mounted');
  return null;
};

toast.warning = (message, options = {}) => {
  if (globalAddToast) {
    return globalAddToast(message, { ...options, type: 'warning' });
  }
  console.warn('Toast: ToastProvider not mounted');
  return null;
};

toast.info = (message, options = {}) => {
  if (globalAddToast) {
    return globalAddToast(message, { ...options, type: 'info' });
  }
  console.warn('Toast: ToastProvider not mounted');
  return null;
};

// Set the global addToast function when ToastProvider mounts
export function setGlobalToastHandler(handler) {
  globalAddToast = handler;
}

export default ToastProvider;
