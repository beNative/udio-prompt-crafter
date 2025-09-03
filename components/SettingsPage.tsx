import React, { useState, useEffect } from 'react';
import type { AppSettings, Preset, Taxonomy } from '../types';
import { Icon } from './icons';
import { logger } from '../utils/logger';
import { JsonEditor } from './JsonEditor';
import { DebugLogModal } from './DebugLogModal';
import { TaxonomyEditor } from './TaxonomyEditor';
import { useSettings } from '../index';

interface SettingsPageProps {
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
const TABS: { id: SettingsTab; label: string; icon: string; electronOnly: boolean }[] = [
    { id: 'ai', label: 'AI Configuration', icon: 'wandSparkles', electronOnly: false },
    { id: 'taxonomy', label: 'Taxonomy', icon: 'tag', electronOnly: false },
    { id: 'presets', label: 'Presets', icon: 'list-bullet', electronOnly: false },
    { id: 'application', label: 'Application', icon: 'cog', electronOnly: true },
];


const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SettingsSidebarButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-bunker-600 dark:text-bunker-300 hover:bg-bunker-100 dark:hover:bg-bunker-800'
        }`}
    >
        <Icon name={icon} className="w-5 h-5" />
        <span>{label}</span>
    </button>
);

const SettingsPanel: React.FC<{title: string; description: string; children: React.ReactNode}> = ({title, description, children}) => (
    <div className="p-8 overflow-y-auto h-full">
        <div className="pb-5 border-b border-bunker-200 dark:border-bunker-800">
          <h2 className="text-3xl font-bold text-bunker-900 dark:text-white">{title}</h2>
          <p className="text-bunker-500 dark:text-bunker-400 mt-1">{description}</p>
        </div>
        <div className="mt-6">
            {children}
        </div>
    </div>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ 
    taxonomy,
    onTaxonomyChange,
    defaultPresets,
    detectedProviders,
    availableModels,
    isDetecting,
    onRefresh 
}) => {
  const { settings, setSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [presetsText, setPresetsText] = useState('');
  const [jsonError, setJsonError] = useState<{ presets: string | null; }>({ presets: null });
  const [isDebugLogModalOpen, setIsDebugLogModalOpen] = useState(false);
  const [debugLogContent, setDebugLogContent] = useState('');

  useEffect(() => {
    if (settings) {
      setPresetsText(JSON.stringify(settings.presets, null, 2));
    }
  }, [settings?.presets]);
  
  const handleSaveAiSettings = (newAiSettings: AppSettings['aiSettings']) => {
      setSettings(prev => prev ? ({ ...prev, aiSettings: newAiSettings }) : null);
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
    setSettings(prev => {
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
  
  if (!settings) return null;

  const renderContent = () => {
      switch(activeTab) {
        case 'ai':
            return (
                <SettingsPanel title="AI Configuration" description="Manage connections to your local AI services like Ollama or LM Studio.">
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="provider" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Provider</label>
                                <button onClick={onRefresh} disabled={isDetecting} className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline">
                                    {isDetecting ? <LoadingSpinner /> : <Icon name="search" className="w-4 h-4 mr-1" />}
                                    {isDetecting ? 'Detecting...' : 'Re-scan'}
                                </button>
                            </div>
                            {detectedProviders.length > 0 ? (
                                <select id="provider" value={settings.aiSettings.provider} onChange={handleProviderChange} className="form-input block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white sm:text-sm">
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
                </SettingsPanel>
            );
        case 'taxonomy':
            return <TaxonomyEditor taxonomy={taxonomy} onSave={onTaxonomyChange} />;
        case 'presets':
            return (
                <SettingsPanel title="Presets" description="For advanced users, presets can be edited directly here. For a user-friendly experience, use the 'Manage Presets' button in the header.">
                    <JsonEditor 
                        id="presets"
                        value={presetsText}
                        onChange={handlePresetsChange}
                        error={jsonError.presets}
                        height="calc(100vh - 280px)"
                    />
                    {jsonError.presets && <p className="mt-1 text-xs text-red-500">{jsonError.presets}</p>}
                    <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-bunker-200/80 dark:border-bunker-800/80">
                      <button onClick={() => { setPresetsText(JSON.stringify(defaultPresets, null, 2)); setJsonError({presets: null}); }} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">Reset to Defaults</button>
                      <button onClick={handleSaveConfigs} disabled={!!jsonError.presets} className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">Save Presets</button>
                    </div>
                </SettingsPanel>
            );
        case 'application':
             if (!isElectron) return <p className="p-8 text-bunker-500">Application settings are only available in the desktop version.</p>;
             const iconSet = settings.iconSet || 'heroicons';
             return (
                <SettingsPanel title="Application Settings" description="Customize the application's appearance and behavior.">
                    <div className="space-y-4 max-w-3xl">
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-bunker-900 rounded-lg border border-bunker-200 dark:border-bunker-800">
                            <div>
                                <p className="font-medium text-bunker-800 dark:text-bunker-200">Icon Set</p>
                                <p className="text-sm text-bunker-500 dark:text-bunker-400 mt-1">
                                    Choose the visual style for icons throughout the application.
                                </p>
                            </div>
                            <div className="flex items-center space-x-1 p-1 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg">
                                <button onClick={() => setSettings(prev => prev ? ({ ...prev, iconSet: 'heroicons' }) : null)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${iconSet === 'heroicons' ? 'bg-blue-600 text-white shadow-sm' : 'text-bunker-500 dark:text-bunker-400 hover:bg-white/60 dark:hover:bg-bunker-700/50'}`}>
                                    Heroicons
                                </button>
                                <button onClick={() => setSettings(prev => prev ? ({ ...prev, iconSet: 'lucide' }) : null)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${iconSet === 'lucide' ? 'bg-blue-600 text-white shadow-sm' : 'text-bunker-500 dark:text-bunker-400 hover:bg-white/60 dark:hover:bg-bunker-700/50'}`}>
                                    Lucide
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-bunker-900 rounded-lg border border-bunker-200 dark:border-bunker-800">
                            <div>
                                <p className="font-medium text-bunker-800 dark:text-bunker-200">View Startup Log</p>
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
                        <div className="flex justify-between items-center p-4 bg-white dark:bg-bunker-900 rounded-lg border border-bunker-200 dark:border-bunker-800">
                            <div>
                                <p className="font-medium text-bunker-800 dark:text-bunker-200">Open Developer Tools on Startup</p>
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
                                    onChange={e => setSettings(prev => prev ? ({ ...prev, openDevToolsOnStart: e.target.checked }) : null)}
                                />
                                <div className="w-11 h-6 bg-bunker-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-bunker-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-bunker-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-bunker-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </SettingsPanel>
             );
        default: return null;
      }
  }

  return (
    <div className="h-full flex bg-bunker-50 dark:bg-bunker-950 text-bunker-800 dark:text-bunker-200">
      <nav className="w-64 border-r border-bunker-200 dark:border-bunker-800 p-4 shrink-0 bg-white dark:bg-bunker-900">
        <h2 className="text-lg font-semibold mb-6 text-bunker-900 dark:text-white px-2">Settings</h2>
        <ul className="space-y-1">
          {TABS.filter(tab => isElectron || !tab.electronOnly).map(tab => (
            <li key={tab.id}>
              <SettingsSidebarButton
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-grow min-h-0">
          {renderContent()}
      </main>

      <DebugLogModal 
        isOpen={isDebugLogModalOpen}
        onClose={() => setIsDebugLogModalOpen(false)}
        logContent={debugLogContent}
      />
    </div>
  );
};