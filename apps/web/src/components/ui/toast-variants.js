/* apps/web/src/components/ui/toast-variants.js */
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const toastVariants = {
  default: 'bg-background text-foreground border-border',
  success:
    'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
  error:
    'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
  warning:
    'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800',
  info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
};

export const toastIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const toastAnimations = {
  enter: 'animate-in slide-in-from-bottom-5 fade-in duration-300',
  exit: 'animate-out slide-out-to-bottom-5 fade-out duration-300',
};
