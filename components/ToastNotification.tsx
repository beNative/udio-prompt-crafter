import React, { useEffect } from 'react';
import { Icon } from './icons';
import type { Toast } from '../types';

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

const typeStyles = {
  info: { icon: 'info', iconColor: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/40', borderColor: 'border-blue-300 dark:border-blue-600/50' },
  success: { icon: 'check', iconColor: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/40', borderColor: 'border-green-300 dark:border-green-600/50' },
  error: { icon: 'warning', iconColor: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/40', borderColor: 'border-red-300 dark:border-red-600/50' },
  loading: { icon: 'loading', iconColor: 'text-bunker-500', bgColor: 'bg-bunker-50 dark:bg-bunker-900/40', borderColor: 'border-bunker-300 dark:border-bunker-600/50' },
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const styles = typeStyles[toast.type];
  const isProgressToast = toast.progress !== undefined;

  return (
    <div className={`w-full max-w-sm rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${styles.bgColor} border ${styles.borderColor} animate-fade-in-scale`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {toast.type === 'loading' ? (
                <svg className={`animate-spin h-6 w-6 ${styles.iconColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Icon name={styles.icon} className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
            )}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-bunker-900 dark:text-white">{toast.title}</p>
            <p className="mt-1 text-sm text-bunker-600 dark:text-bunker-300">{toast.message}</p>
            {toast.actions && (
              <div className="mt-3 flex space-x-4">
                {toast.actions.map((action, index) => (
                  <button key={index} onClick={action.onClick} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={() => onDismiss(toast.id)} className="rounded-md inline-flex text-bunker-400 hover:text-bunker-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="sr-only">Close</span>
              <Icon name="x" className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        {isProgressToast && (
            <div className="mt-2 w-full bg-bunker-200 dark:bg-bunker-700 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${toast.progress}%` }}></div>
            </div>
        )}
      </div>
    </div>
  );
};