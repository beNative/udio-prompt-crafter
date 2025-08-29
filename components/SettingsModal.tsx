import React, { useState, useEffect } from 'react';
import type { AiSettings } from '../types';
import { Icon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSave: (settings: AiSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [currentSettings, setCurrentSettings] = useState<AiSettings>(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onSave(currentSettings);
    onClose();
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
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
            <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">
              AI Settings
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
                <Icon name="x" className="w-5 h-5 text-bunker-500" />
            </button>
        </div>
        
        <div className="mt-6 space-y-6">
            <div>
                <label htmlFor="provider" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Provider</label>
                <select 
                    id="provider" 
                    value={currentSettings.provider}
                    onChange={e => setCurrentSettings(s => ({...s, provider: e.target.value as AiSettings['provider']}))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-bunker-300 dark:border-bunker-600 bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    <option value="ollama">Ollama</option>
                    <option value="openai-compatible">OpenAI-Compatible (LM Studio, etc.)</option>
                </select>
                <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">Select the API format for your local LLM.</p>
            </div>
            <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">API Base URL</label>
                <input 
                    type="text" 
                    id="baseUrl"
                    value={currentSettings.baseUrl}
                    onChange={e => setCurrentSettings(s => ({...s, baseUrl: e.target.value}))}
                    placeholder="e.g., http://localhost:11434"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-bunker-300 dark:border-bunker-600 rounded-md bg-bunker-50 dark:bg-bunker-800 text-bunker-900 dark:text-white"
                />
                 <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">The base URL of your local LLM API endpoint.</p>
            </div>
             <div>
                <label htmlFor="model" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Model Name</label>
                <input 
                    type="text" 
                    id="model"
                    value={currentSettings.model}
                    onChange={e => setCurrentSettings(s => ({...s, model: e.target.value}))}
                    placeholder="e.g., llama3"
                    className="mt-1 block w-full shadow-sm sm:text-sm border-bunker-300 dark:border-bunker-600 rounded-md bg-bunker-50 dark:bg-bunker-800 text-bunker-900 dark:text-white"
                />
                 <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">The name of the model you want to use (e.g., llama3, gemma).</p>
            </div>
        </div>

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
                className="rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={handleSave}
            >
                Save Settings
            </button>
        </div>
      </div>
    </div>
  );
};
