import React from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';

interface ConflictResolutionModalProps {
  conflict: {
    newlySelectedTag: Tag;
    conflictingTag: Tag;
  };
  onResolve: (keepNew: boolean) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ conflict, onResolve }) => {
  if (!conflict) return null;

  const { newlySelectedTag, conflictingTag } = conflict;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <Icon name="warning" className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white" id="modal-title">
              Resolve Tag Conflict
            </h3>
            <div className="mt-2">
              <p className="text-sm text-bunker-600 dark:text-bunker-300">
                You've selected <strong className="text-blue-500">"{newlySelectedTag.label}"</strong>, which conflicts with the already selected tag <strong className="text-red-500">"{conflictingTag.label}"</strong>.
              </p>
              <p className="text-sm text-bunker-600 dark:text-bunker-300 mt-2">
                Please choose which tag you'd like to keep.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-blue-500 sm:col-start-2 sm:text-sm transition-colors"
            onClick={() => onResolve(true)}
          >
            Keep "{newlySelectedTag.label}"
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-bunker-300 dark:border-bunker-600 shadow-sm px-4 py-2 bg-white dark:bg-bunker-800 text-base font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-bunker-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-colors"
            onClick={() => onResolve(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};