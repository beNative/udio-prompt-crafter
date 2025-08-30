import React from 'react';
import { Icon } from './icons';

interface DebugLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logContent: string;
}

export const DebugLogModal: React.FC<DebugLogModalProps> = ({ isOpen, onClose, logContent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">
            Startup Debug Log
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>
        <div className="flex-grow mt-4 overflow-y-auto">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-bunker-700 dark:text-bunker-300">
            <code>{logContent}</code>
          </pre>
        </div>
        <div className="flex-shrink-0 mt-4 pt-4 border-t border-bunker-200 dark:border-bunker-800 text-xs text-bunker-500">
          This log captures events from the Electron main process from the very start of the application. It is useful for diagnosing critical startup issues like a white screen. The log is cleared each time the application starts.
        </div>
      </div>
    </div>
  );
};
