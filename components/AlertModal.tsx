import React from 'react';
import { Icon } from './icons';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'info' | 'warning' | 'error';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
}) => {
  if (!isOpen) return null;

  const iconMap = {
      info: { name: 'info', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
      warning: { name: 'warning', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
      error: { name: 'warning', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  };
  const currentIcon = iconMap[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all opacity-0 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <div className="flex items-start">
           <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${currentIcon.bg} sm:mx-0 sm:h-10 sm:w-10`}>
                <Icon name={currentIcon.name} className={`h-6 w-6 ${currentIcon.color}`} />
           </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-bunker-600 dark:text-bunker-300">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-blue-500 sm:text-sm transition-colors"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
