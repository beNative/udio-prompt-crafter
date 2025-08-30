import React, { useState, useEffect } from 'react';
import type { AppSettings, Preset, Taxonomy } from '../types';
import { Icon } from './icons';
import { logger } from '../utils/logger';
import { JsonEditor } from './JsonEditor';
import { DebugLogModal } from './DebugLogModal';
import { TaxonomyEditor } from './TaxonomyEditor';

interface SettingsPageProps {
  settings: AppSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AppSettings | null>>;
  taxonomy: Taxonomy;
  onTaxonomyChange: (newTaxonomy: Taxonomy, reset?: boolean) => Promise<void>;
  defaultPresets: Preset[];
  detectedProviders: ('ollama' | 'lmstudio')[];
  availableModels: { ollama: string[]; lmstudio: string[] };
  isDetecting: boolean;
  onRefresh: () => void;
}

const isElectron = !!window.electronAPI;

type SettingsTab = 'ai' | 'taxonomy' | 'presets' | 'application';

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            isActive
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-bunker-500 hover:text-bunker-700 dark:text-bunker-400 dark:hover:text-bunker-200 hover:border-bunker-300 dark:hover:border-bunker-600'
        }`}
    >
        {label}
    </button>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    settings, 
    onSettingsChange, 
    taxonomy,
    onTaxonomyChange,
    defaultPresets,
    detectedProviders,
    availableModels,
    isDetecting,
    onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [presetsText, setPresetsText] = useState('');
  const [jsonError, setJsonError] = useState<{ presets: string | null; }>({ presets: null });
  const [isDebugLogModalOpen, setIsDebugLogModalOpen] = useState(false);
  const [debugLogContent, setDebugLogContent] = useState('');

  useEffect(() => {
    setPresetsText(JSON.stringify(settings.presets, null, 2));
  }, [settings.presets]);
  
  const handleSaveAiSettings = (newAiSettings: AppSettings['aiSettings']) => {
      onSettingsChange(prev => prev ? ({ ...prev, aiSettings: newAiSettings }) : null);
  }

  const handlePresetsChange = (text: string) => {
    setPresetsText(text);
    try {
      JSON.parse(text);
      setJsonError({ presets: null });
    } catch (error: any) {
      setJsonError({ presets: error.message });
    }
  }

  const handleSaveConfigs = () => {
    if (jsonError.presets) {
        logger.error("Cannot save due to invalid JSON in settings.");
        return;
    }
    logger.info("Saving presets configuration.");
    onSettingsChange(prev => {
      if (!prev) return null;
      return {
        ...prev,
        presets: JSON.parse(presetsText),
      }
    });
  }

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AppSettings['aiSettings']['provider'];
    handleSaveAiSettings({
        provider: newProvider,
        baseUrl: newProvider === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234/v1',
        model: availableModels[newProvider][0] || '',
    });
  };

  const handleShowDebugLog = async () => {
    if (isElectron) {
      try {
        const content = await window.electronAPI.readDebugLog();
        setDebugLogContent(content);
        setIsDebugLogModalOpen(true);
      } catch (e: any) {
        logger.error("Failed to read debug log", { error: e.message });
        alert("Failed to read debug log.");
      }
    }
  };
  
  const renderContent = () => {
      switch(activeTab) {
        case 'ai':
            return (
                <div className="space-y-6 max-w-2xl">
                    <div>
                      <div className="flex justify-between items-center">
                          <label htmlFor="provider" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Provider</label>
                          <button onClick={onRefresh} disabled={isDetecting} className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline">
                              {isDetecting ? <LoadingSpinner /> : <Icon name="search" className="w-4 h-4 mr-1" />}
                              {isDetecting ? 'Detecting...' : 'Re-scan'}
                          </button>
                      </div>
                      {detectedProviders.length > 0 ? (
                          <select id="provider" value={settings.aiSettings.provider} onChange={handleProviderChange} className="form-input mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white sm:text-sm">
                              {detectedProviders.includes('ollama') && <option value="ollama">Ollama</option>}
                              {detectedProviders.includes('lmstudio') && <option value="lmstudio">LM Studio</option>}
                          </select>
                      ) : !isDetecting && (
                          <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">No local LLM services detected. Please ensure Ollama or LM Studio is running.</div>
                      )}
                    </div>
                    <div>
                        <label htmlFor="baseUrl" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">API Base URL</label>
                        <input type="text" id="baseUrl" value={settings.aiSettings.baseUrl} onChange={e => handleSaveAiSettings({...settings.aiSettings, baseUrl: e.target.value})} className="form-input bg-bunker-50 dark:bg-bunker-800 dark:text-white"/>
                    </div>
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Model Name</label>
                        <select id="model" value={settings.aiSettings.model} onChange={e => handleSaveAiSettings({...settings.aiSettings, model: e.target.value})} disabled={!settings.aiSettings.provider || (availableModels[settings.aiSettings.provider]?.length ?? 0) === 0} className="form-input mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white sm:text-sm disabled:opacity-50">
                            {(availableModels[settings.aiSettings.provider] || []).map(modelName => (<option key={modelName} value={modelName}>{modelName}</option>))}
                        </select>
                    </div>
                </div>
            );
        case 'taxonomy':
            return <TaxonomyEditor taxonomy={taxonomy} onSave={onTaxonomyChange} />;
        case 'presets':
            return (
                 <div className="max-w-4xl">
                    <p className="text-sm text-bunker-500 dark:text-bunker-400 mb-4">
                      For advanced users, presets can be edited directly here. For a user-friendly experience, use the "Manage Presets" button in the header.
                    </p>
                    <JsonEditor 
                        id="presets"
                        value={presetsText}
                        onChange={handlePresetsChange}
                        error={jsonError.presets}
                        height="400px"
                    />
                    {jsonError.presets && <p className="mt-1 text-xs text-red-500">{jsonError.presets}</p>}
                    <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-bunker-200/80 dark:border-bunker-800/80">
                      <button onClick={() => { setPresetsText(JSON.stringify(defaultPresets, null, 2)); setJsonError({presets: null}); }} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">Reset to Defaults</button>
                      <button onClick={handleSaveConfigs} disabled={!!jsonError.presets} className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">Save Presets</button>
                    </div>
                </div>
            );
        case 'application':
             if (!isElectron) return <p className="text-bunker-500">Application settings are only available in the desktop version.</p>;
             return (
                <div className="space-y-6 max-w-2xl">
                   <div className="flex justify-between items-center p-4 bg-white/50 dark:bg-bunker-900/50 rounded-lg border border-bunker-200/80 dark:border-bunker-800/80">
                        <div>
                            <p className="text-sm font-medium text-bunker-700 dark:text-bunker-300">View Startup Log</p>
                            <p className="text-sm text-bunker-500 dark:text-bunker-400 mt-1">
                                If you experience a white screen or other critical startup errors, this log can help identify the problem.
                            </p>
                        </div>
                        <button 
                            onClick={handleShowDebugLog}
                            className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors"
                        >
                            Show Log
                        </button>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/50 dark:bg-bunker-900/50 rounded-lg border border-bunker-200/80 dark:border-bunker-800/80">
                        <div>
                            <p className="text-sm font-medium text-bunker-700 dark:text-bunker-300">Open Developer Tools on Startup</p>
                            <p className="text-sm text-bunker-500 dark:text-bunker-400 mt-1">
                                Automatically opens the developer console when the application starts.
                            </p>
                        </div>
                        <label htmlFor="dev-tools-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="dev-tools-toggle" 
                                className="sr-only peer" 
                                checked={settings.openDevToolsOnStart ?? false}
                                onChange={e => onSettingsChange(prev => prev ? ({ ...prev, openDevToolsOnStart: e.target.checked }) : null)}
                            />
                            <div className="w-11 h-6 bg-bunker-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-bunker-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-bunker-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-bunker-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
             );
        default: return null;
      }
  }

  return (
    <div className="p-6 bg-bunker-50 dark:bg-transparent min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="pb-5 border-b border-bunker-200 dark:border-bunker-800">
          <h2 className="text-3xl font-bold text-bunker-900 dark:text-white">Settings</h2>
          <p className="text-bunker-500 dark:text-bunker-400 mt-1">Manage application configuration and AI connections.</p>
        </div>

        <div className="mt-4 border-b border-bunker-200 dark:border-bunker-800">
            <nav className="-mb-px flex space-x-6">
                <TabButton label="AI Configuration" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                <TabButton label="Taxonomy" isActive={activeTab === 'taxonomy'} onClick={() => setActiveTab('taxonomy')} />
                <TabButton label="Presets" isActive={activeTab === 'presets'} onClick={() => setActiveTab('presets')} />
                {isElectron && <TabButton label="Application" isActive={activeTab === 'application'} onClick={() => setActiveTab('application')} />}
            </nav>
        </div>
        
        <div className="mt-6">
            {renderContent()}
        </div>
      </div>

      <DebugLogModal 
        isOpen={isDebugLogModalOpen}
        onClose={() => setIsDebugLogModalOpen(false)}
        logContent={debugLogContent}
      />
    </div>
  );
};
