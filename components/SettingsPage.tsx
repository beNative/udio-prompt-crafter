import React, { useState, useEffect, useCallback } from 'react';
import type { AppSettings, Preset, Macro } from '../types';
import { Icon } from './icons';
import { logger } from '../utils/logger';
import { JsonEditor } from './JsonEditor';

interface SettingsPageProps {
  settings: AppSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AppSettings | null>>;
  defaultPresets: Preset[];
  defaultMacros: Macro[];
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-500" xmlns="http://www.w.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-bunker-900 rounded-lg border border-bunker-200 dark:border-bunker-800 shadow-sm">
        <div className="p-4 border-b border-bunker-200 dark:border-bunker-800">
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4 space-y-6">
            {children}
        </div>
    </div>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange, defaultPresets, defaultMacros }) => {
  const [presetsText, setPresetsText] = useState('');
  const [macrosText, setMacrosText] = useState('');
  const [jsonError, setJsonError] = useState<{ presets: string | null; macros: string | null; }>({ presets: null, macros: null });
  
  // State for AI service detection
  const [detectedProviders, setDetectedProviders] = useState<('ollama' | 'lmstudio')[]>([]);
  const [availableModels, setAvailableModels] = useState<{ ollama: string[]; lmstudio: string[] }>({ ollama: [], lmstudio: [] });
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    setPresetsText(JSON.stringify(settings.presets, null, 2));
    setMacrosText(JSON.stringify(settings.macros, null, 2));
  }, [settings.presets, settings.macros]);
  
  const handleSaveAiSettings = (newAiSettings: AppSettings['aiSettings']) => {
      onSettingsChange(prev => prev ? ({ ...prev, aiSettings: newAiSettings }) : null);
  }

  const handlePresetsChange = (text: string) => {
    setPresetsText(text);
    try {
      JSON.parse(text);
      setJsonError(e => ({...e, presets: null }));
    } catch (error: any) {
      setJsonError(e => ({...e, presets: error.message }));
    }
  }

  const handleMacrosChange = (text: string) => {
    setMacrosText(text);
    try {
      JSON.parse(text);
      setJsonError(e => ({...e, macros: null }));
    } catch (error: any) {
      setJsonError(e => ({...e, macros: error.message }));
    }
  }

  const handleSaveConfigs = () => {
    if (jsonError.presets || jsonError.macros) {
        logger.error("Cannot save due to invalid JSON in settings.");
        return;
    }
    logger.info("Saving presets and macros configuration.");
    onSettingsChange(prev => {
      if (!prev) return null;
      return {
        ...prev,
        presets: JSON.parse(presetsText),
        macros: JSON.parse(macrosText)
      }
    });
  }

  const detectServicesAndFetchModels = useCallback(async () => {
    logger.info("Detecting local LLM services...");
    setIsDetecting(true);
    const newDetected: ('ollama' | 'lmstudio')[] = [];
    const newModels: { ollama: string[]; lmstudio: string[] } = { ollama: [], lmstudio: [] };

    try {
        const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
            const data = await res.json();
            newDetected.push('ollama');
            if (data.models) newModels.ollama = data.models.map((m: any) => m.name).sort();
        }
    } catch (e) { /* ignore */ }

    try {
        const res = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
            const data = await res.json();
            newDetected.push('lmstudio');
            if (data.data) newModels.lmstudio = data.data.map((m: any) => m.id).sort();
        }
    } catch (e) { /* ignore */ }

    setDetectedProviders(newDetected);
    setAvailableModels(newModels);
    setIsDetecting(false);

    onSettingsChange(currentSettings => {
        if (!currentSettings) return null;
        if (newDetected.length > 0 && !newDetected.includes(currentSettings.aiSettings.provider)) {
            const newProvider = newDetected[0];
            return {
                ...currentSettings,
                aiSettings: {
                    provider: newProvider,
                    baseUrl: newProvider === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234/v1',
                    model: newModels[newProvider][0] || '',
                }
            };
        }
        return currentSettings;
    });
  }, [onSettingsChange]);

  useEffect(() => {
    detectServicesAndFetchModels();
  }, [detectServicesAndFetchModels]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AppSettings['aiSettings']['provider'];
    handleSaveAiSettings({
        provider: newProvider,
        baseUrl: newProvider === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234/v1',
        model: availableModels[newProvider][0] || '',
    });
  };

  return (
    <div className="p-6 bg-bunker-50 dark:bg-bunker-950 min-h-full">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-bunker-900 dark:text-white">Settings</h2>
          <p className="text-bunker-500 dark:text-bunker-400 mt-1 text-sm">Manage application configuration.</p>
        </div>

        <SettingsCard title="AI Configuration">
          <div>
              <div className="flex justify-between items-center">
                  <label htmlFor="provider" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Provider</label>
                  <button onClick={detectServicesAndFetchModels} disabled={isDetecting} className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline">
                      {isDetecting ? <LoadingSpinner /> : <Icon name="search" className="w-4 h-4 mr-1" />}
                      {isDetecting ? 'Detecting...' : 'Re-scan'}
                  </button>
              </div>
              {detectedProviders.length > 0 ? (
                  <select id="provider" value={settings.aiSettings.provider} onChange={handleProviderChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-bunker-300 dark:border-bunker-700 bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                      {detectedProviders.includes('ollama') && <option value="ollama">Ollama</option>}
                      {detectedProviders.includes('lmstudio') && <option value="lmstudio">LM Studio</option>}
                  </select>
              ) : !isDetecting && (
                  <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">No local LLM services detected. Please ensure Ollama or LM Studio is running.</div>
              )}
          </div>
          <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">API Base URL</label>
              <input type="text" id="baseUrl" value={settings.aiSettings.baseUrl} onChange={e => handleSaveAiSettings({...settings.aiSettings, baseUrl: e.target.value})} className="mt-1 block w-full shadow-sm sm:text-sm border-bunker-300 dark:border-bunker-700 rounded-md bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-white"/>
          </div>
          <div>
              <label htmlFor="model" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Model Name</label>
              <select id="model" value={settings.aiSettings.model} onChange={e => handleSaveAiSettings({...settings.aiSettings, model: e.target.value})} disabled={!settings.aiSettings.provider || (availableModels[settings.aiSettings.provider]?.length ?? 0) === 0} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-bunker-300 dark:border-bunker-700 bg-white dark:bg-bunker-800 text-bunker-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50">
                  {(availableModels[settings.aiSettings.provider] || []).map(modelName => (<option key={modelName} value={modelName}>{modelName}</option>))}
              </select>
          </div>
        </SettingsCard>
        
        <SettingsCard title="Presets & Macros">
          <div>
            <label htmlFor="presets" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Presets JSON</label>
            <JsonEditor 
                id="presets"
                value={presetsText}
                onChange={handlePresetsChange}
                error={jsonError.presets}
                height="250px"
            />
            {jsonError.presets && <p className="mt-1 text-xs text-red-500">{jsonError.presets}</p>}
          </div>
          <div>
            <label htmlFor="macros" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Macros JSON</label>
            <JsonEditor 
                id="macros"
                value={macrosText}
                onChange={handleMacrosChange}
                error={jsonError.macros}
                height="250px"
            />
            {jsonError.macros && <p className="mt-1 text-xs text-red-500">{jsonError.macros}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-bunker-200 dark:border-bunker-800">
              <button onClick={() => { setPresetsText(JSON.stringify(defaultPresets, null, 2)); setMacrosText(JSON.stringify(defaultMacros, null, 2)); setJsonError({presets: null, macros: null}); }} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700">Reset to Defaults</button>
              <button onClick={handleSaveConfigs} disabled={!!jsonError.presets || !!jsonError.macros} className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Save Presets & Macros</button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};
