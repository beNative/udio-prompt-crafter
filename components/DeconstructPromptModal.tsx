import React, { useState } from 'react';
import { Icon } from './icons';

interface DeconstructPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeconstruct: (prompt: string) => Promise<boolean>;
}

export const DeconstructPromptModal: React.FC<DeconstructPromptModalProps> = ({ isOpen, onClose, onDeconstruct }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeconstruct = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const success = await onDeconstruct(prompt);
      if (success) {
        onClose();
        setPrompt('');
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" 
        aria-modal="true" 
        role="dialog"
        onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
            <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">
              AI Prompt Deconstruction
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
                <Icon name="x" className="w-5 h-5 text-bunker-500" />
            </button>
        </div>
        
        <div className="mt-6">
           <p className="text-sm text-bunker-600 dark:text-bunker-300 mb-4">
              Paste a descriptive prompt below (e.g., from another AI music tool). The AI will analyze the text and attempt to select the corresponding tags from the taxonomy. This will replace your currently selected tags.
           </p>
           <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full h-48 p-3 bg-bunker-100 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="e.g., A dreamy, atmospheric synthwave track with an 80s vibe, layered synths, and soft, ethereal female vocals."
            />
        </div>

        {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
                <strong>Error:</strong> {error}
            </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
            <button
                type="button"
                className="rounded-md border border-bunker-300 dark:border-bunker-600 shadow-sm px-4 py-2 bg-white dark:bg-bunker-800 text-base font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bunker-500 sm:text-sm"
                onClick={onClose}
            >
                Cancel
            </button>
            <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                onClick={handleDeconstruct}
                disabled={isLoading || !prompt}
            >
                {isLoading ? (
                    <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                    </>
                ) : "Deconstruct Prompt"}
            </button>
        </div>
      </div>
    </div>
  );
};
