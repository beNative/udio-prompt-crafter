import React, { useState, useEffect } from 'react';
import type { AiSettings } from '../types';
import { Icon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSave: (settings: AiSettings) => void;
  detectedProviders: ('ollama' | 'lmstudio')[];
  availableModels: { ollama: string[]; lmstudio: string[] };
  isDetecting: boolean;
  onRefresh: () => void;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave,
    detectedProviders,
    availableModels,
    isDetecting,
    onRefresh
}) => {
  const [currentSettings, setCurrentSettings] = useState<AiSettings>(settings);

  useEffect(() => {
    // Sync local state with props when settings change or modal opens
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

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AiSettings['provider'];
    // Set default URL and first available model when provider changes
    const newBaseUrl = newProvider === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234/v1';
    const modelsForProvider = availableModels[newProvider] || [];
    const newModel = modelsForProvider[0] || '';

    setCurrentSettings({
        provider: newProvider,
        baseUrl: newBaseUrl,
        model: newModel,
    });
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" 
        aria-modal="true" 
        role="dialog"
        onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
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
                <div className="flex justify-between items-center">
                    <label htmlFor="provider" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Provider</label>
                    <button onClick={onRefresh} disabled={isDetecting} className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline">
                       {isDetecting ? <LoadingSpinner /> : <Icon name="search" className="w-4 h-4 mr-1" />}
                       {isDetecting ? 'Detecting...' : 'Re-scan'}
                    </button>
                </div>

                { detectedProviders.length > 0 ? (
                    <>
                        <select 
                            id="provider" 
                            value={currentSettings.provider}
                            onChange={handleProviderChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-bunker-300 dark:border-bunker-600 bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {detectedProviders.includes('ollama') && <option value="ollama">Ollama</option>}
                            {detectedProviders.includes('lmstudio') && <option value="lmstudio">LM Studio</option>}
                        </select>
                        <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">Automatically detected local LLM services.</p>
                    </>
                ) : !isDetecting ? (
                    <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
                        No local LLM services detected. Please ensure Ollama or LM Studio is running and click "Re-scan".
                    </div>
                ) : null }
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
                <select 
                    id="model"
                    value={currentSettings.model}
                    onChange={e => setCurrentSettings(s => ({...s, model: e.target.value}))}
                    disabled={!currentSettings.provider || (availableModels[currentSettings.provider]?.length ?? 0) === 0}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-bunker-300 dark:border-bunker-600 bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50"
                >
                    {(availableModels[currentSettings.provider] || []).map(modelName => (
                        <option key={modelName} value={modelName}>{modelName}</option>
                    ))}
                </select>
                {currentSettings.provider === 'lmstudio' ? (
                     <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">
                        The selected model will be requested from the API. For best results, ensure this model is loaded in the LM Studio application beforehand.
                     </p>
                ) : (
                     <p className="mt-2 text-xs text-bunker-500 dark:text-bunker-400">Select an available model from the detected provider.</p>
                )}
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
