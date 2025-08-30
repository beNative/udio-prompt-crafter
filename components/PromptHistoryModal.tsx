
import React from 'react';
import type { HistoryEntry } from '../types';
import { Icon } from './icons';

interface PromptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoad,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col transform opacity-0 animate-fade-in-scale">
        <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">Prompt History</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>

        <div className="flex-grow mt-4 overflow-y-auto pr-2">
          {history.length > 0 ? (
            <ul className="divide-y divide-bunker-200 dark:divide-bunker-800">
              {history.map((entry, index) => (
                <li key={entry.timestamp + index}>
                  <button
                    onClick={() => onLoad(entry)}
                    className="w-full text-left py-3 px-2 rounded-md hover:bg-bunker-100 dark:hover:bg-bunker-800/60 transition-colors"
                  >
                    <p className="text-sm text-bunker-800 dark:text-bunker-200 truncate">{entry.promptString}</p>
                    <time dateTime={entry.timestamp} className="text-xs text-bunker-400 dark:text-bunker-500 mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-bunker-500">
              <p>No history yet.</p>
              <p className="text-sm mt-1">Your generated prompts will appear here.</p>
            </div>
          )}
        </div>
        
        {history.length > 0 && (
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-bunker-200 dark:border-bunker-800 flex justify-end">
                <button
                    onClick={onClear}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                    <Icon name="trash" className="w-4 h-4" />
                    <span>Clear History</span>
                </button>
            </div>
        )}

      </div>
    </div>
  );
};