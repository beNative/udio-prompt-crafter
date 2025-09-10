import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterPresets } from './data/presets';
import type { Tag, Category, SelectedTag, Preset, Conflict, Taxonomy, AppSettings, AiStatus, HistoryEntry, UdioParams, Toast, UpdateInfo } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { CommandPalette } from './components/CommandPalette';
import { ResizablePanels } from './components/ResizablePanels';
import { SettingsPage } from './components/SettingsPage';
import { logger } from './utils/logger';
import { LogPanel } from './components/LogPanel';
import { ResizableVerticalPanel } from './components/ResizableVerticalPanel';
import { InfoPage } from './components/InfoPage';
import { StatusBar } from './components/StatusBar';
import { SavePresetModal } from './components/SavePresetModal';
import { PresetManagerModal } from './components/PresetManagerModal';
import { PromptHistoryModal } from './components/PromptHistoryModal';
import { DeconstructPromptModal } from './components/DeconstructPromptModal';
import { ThematicRandomizerModal } from './components/ThematicRandomizerModal';
import { SettingsContext } from './index';
import { AlertModal } from './components/AlertModal';
import { ToastContainer } from './components/ToastContainer';

interface ConflictState {
  newlySelectedTag: Tag;
  conflictingTag: Tag;
}

const isElectron = !!window.electronAPI;

// Inject keyframes for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-scale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in-scale {
    animation: fade-in-scale 0.2s ease-out forwards;
  }
`;
document.head.appendChild(style);


const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [panelSizes, setPanelSizes] = useLocalStorage('panel-sizes', [20, 45, 35]);
  const [logPanelHeight, setLogPanelHeight] = useLocalStorage('log-panel-height', 288);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('prompt-history', []);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [udioParams, setUdioParams] = useState<UdioParams>({ instrumental: false });
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<'crafter' | 'settings' | 'info'>('crafter');
  
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [isPresetManagerModalOpen, setIsPresetManagerModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeconstructModalOpen, setIsDeconstructModalOpen] = useState(false);
  const [isThematicRandomizerModalOpen, setIsThematicRandomizerModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'info' | 'warning' | 'error' } | null>(null);

  // State for global features
  const [appVersion, setAppVersion] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatus>('checking');
  const [detectedProviders, setDetectedProviders] = useState<('ollama' | 'lmstudio')[]>([]);
  const [availableModels, setAvailableModels] = useState<{ ollama: string[]; lmstudio: string[] }>({ ollama: [], lmstudio: [] });
  const [isDetecting, setIsDetecting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const updateToastIdRef = useRef<number | null>(null);
  const initialUpdateCheckHandled = useRef(false);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateToast = (id: number, updates: Partial<Omit<Toast, 'id'>>) => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }
  
  const detectServicesAndFetchModels = useCallback(async () => {
    logger.info("Detecting local LLM services...");
    setAiStatus('checking');
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
    setAiStatus(newDetected.length > 0 ? 'connected' : 'disconnected');
    logger.info(`Service detection complete. Found: ${newDetected.join(', ') || 'None'}`);

    setAppSettings(currentSettings => {
        if (!currentSettings) return null;
        if (newDetected.length > 0 && !newDetected.includes(currentSettings.aiSettings.provider)) {
            const newProvider = newDetected[0];
            logger.info(`Current AI provider not detected, switching to ${newProvider}.`);
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
  }, [setAppSettings]);

  const handleClear = useCallback(() => {
    logger.info('Clearing all selected tags and text.');
    setSelectedTags({});
    setTextCategoryValues({});
    setUdioParams({ instrumental: false });
  }, []);

  const handleTaxonomyChange = useCallback(async (newTaxonomy: Taxonomy, reset: boolean = false) => {
    logger.info(reset ? "Resetting taxonomy to default." : "Saving custom taxonomy.");
    
    let taxonomyToSaveAndSet: Taxonomy;

    if (reset) {
        if (isElectron) {
            await window.electronAPI.resetCustomTaxonomy();
            const defaultData = await window.electronAPI.readDefaultTaxonomy();
            taxonomyToSaveAndSet = defaultData.taxonomy;
        } else {
            localStorage.removeItem('custom-taxonomy');
            const res = await fetch('./taxonomy.json');
            const data = await res.json();
            taxonomyToSaveAndSet = data.taxonomy;
        }
    } else {
        taxonomyToSaveAndSet = newTaxonomy;
        if (isElectron) {
            await window.electronAPI.writeCustomTaxonomy(taxonomyToSaveAndSet);
        } else {
            localStorage.setItem('custom-taxonomy', JSON.stringify(taxonomyToSaveAndSet));
        }
    }
    
    setTaxonomy(taxonomyToSaveAndSet);
    setCategories(taxonomyToSaveAndSet);
    
    // If the currently selected category was deleted, select the first one.
    if (taxonomyToSaveAndSet.length > 0 && !taxonomyToSaveAndSet.some(c => c.id === activeCategoryId)) {
      setActiveCategoryId(taxonomyToSaveAndSet[0].id);
    } else if (taxonomyToSaveAndSet.length === 0) {
      setActiveCategoryId('');
    }
    
    handleClear();
    logger.info("Taxonomy has been updated. The application state has been reset.");

  }, [activeCategoryId, handleClear]);

  useEffect(() => {
    logger.info("Application starting up...");

    if (isElectron) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
        logger.info(`App version: ${version}`);
      });
    }

    const loadAppSettings = async () => {
      if (isElectron) {
        try {
          const settings = await window.electronAPI.readSettings();
          logger.info("Application settings loaded from file.");
          setAppSettings(settings);
        } catch (e: any) {
           logger.error("Failed to read settings file.", { error: e.message });
           setError("Could not read the application settings file.");
        }
      } else {
        logger.info("Running in web mode, loading settings from localStorage.");
        const storedPresets = localStorage.getItem('user-presets');
        const storedAiSettings = localStorage.getItem('ai-settings');
        const storedPromptRatio = localStorage.getItem('prompt-panel-ratio');
        const storedIconSet = localStorage.getItem('icon-set');
        setAppSettings({
          presets: storedPresets ? JSON.parse(storedPresets) : starterPresets,
          aiSettings: storedAiSettings ? JSON.parse(storedAiSettings) : {
            provider: 'ollama',
            baseUrl: 'http://localhost:11434',
            model: 'llama3',
          },
          promptPanelRatio: storedPromptRatio ? JSON.parse(storedPromptRatio) : 50,
          iconSet: storedIconSet ? JSON.parse(storedIconSet) : 'heroicons',
        });
      }
    };
    
    const loadTaxonomy = async () => {
        try {
            let loadedTaxonomy: Taxonomy | null = null;
            if (isElectron) {
                loadedTaxonomy = await window.electronAPI.readCustomTaxonomy();
                if (!loadedTaxonomy) {
                    const defaultTaxonomyData = await window.electronAPI.readDefaultTaxonomy();
                    loadedTaxonomy = defaultTaxonomyData.taxonomy;
                }
            } else {
                const storedTaxonomy = localStorage.getItem('custom-taxonomy');
                if (storedTaxonomy) {
                    loadedTaxonomy = JSON.parse(storedTaxonomy);
                } else {
                    const res = await fetch('./taxonomy.json');
                    if (!res.ok) throw new Error(`Failed to load taxonomy. Status: ${res.status}`);
                    const data = await res.json();
                    loadedTaxonomy = data.taxonomy;
                }
            }
            if (loadedTaxonomy) {
                logger.info("Taxonomy loaded successfully.");
                setTaxonomy(loadedTaxonomy);
                setCategories(loadedTaxonomy);
                if (loadedTaxonomy.length > 0) {
                  setActiveCategoryId(loadedTaxonomy[0].id);
                }
            } else {
                throw new Error("Taxonomy data is null or invalid.");
            }
        } catch (e: any) {
            console.error("Failed to load taxonomy:", e);
            const errorMessage = "Could not load the core taxonomy configuration. The application cannot start.";
            logger.error(errorMessage, { error: e.message });
            setError(errorMessage);
        }
    };

    Promise.all([loadAppSettings(), loadTaxonomy()]).then(() => {
        detectServicesAndFetchModels();
    }).finally(() => {
        setIsLoading(false);
    });
  }, [detectServicesAndFetchModels]);

  useEffect(() => {
    if (!appSettings) return;

    if (isElectron) {
      window.electronAPI.writeSettings(appSettings);
    } else {
      localStorage.setItem('user-presets', JSON.stringify(appSettings.presets));
      localStorage.setItem('ai-settings', JSON.stringify(appSettings.aiSettings));
      if (appSettings.promptPanelRatio) {
        localStorage.setItem('prompt-panel-ratio', JSON.stringify(appSettings.promptPanelRatio));
      }
      if (appSettings.iconSet) {
        localStorage.setItem('icon-set', JSON.stringify(appSettings.iconSet));
      }
    }
  }, [appSettings]);
  
  const { taxonomyMap, allTags } = useMemo(() => {
    if (!taxonomy) {
      return { taxonomyMap: new Map(), allTags: [] };
    }
    const newTaxonomyMap = new Map<string, Tag & { categoryId: string }>();
    const allT: Tag[] = [];
    taxonomy.forEach(cat => {
      cat.tags.forEach(tag => {
        newTaxonomyMap.set(tag.id, { ...tag, categoryId: cat.id });
        allT.push(tag);
      });
    });
    logger.debug('Taxonomy map and tag list created.', { tagCount: allT.length });
    return { taxonomyMap: newTaxonomyMap, allTags: allT };
  }, [taxonomy]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === ';') {
        event.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  useEffect(() => {
    if (!isElectron) return;
    
    const unsubscribe = window.electronAPI.onUpdateEvent((event, data) => {
        logger.info(`Received update event: ${event}`, data);

        const currentToastId = updateToastIdRef.current;

        switch(event) {
            case 'update-available': {
                if (currentToastId) removeToast(currentToastId);
                const info = data as UpdateInfo;
                const id = addToast({
                    type: 'info',
                    title: `Update Available: v${info.version}`,
                    message: 'A new version is ready. Would you like to download it now?',
                    actions: [{
                        label: 'Download',
                        onClick: () => {
                            window.electronAPI.downloadUpdate();
                            updateToast(id, {
                                type: 'loading',
                                title: `Downloading v${info.version}`,
                                message: 'Preparing to download...',
                                progress: 0,
                                actions: undefined
                            });
                        }
                    }]
                });
                updateToastIdRef.current = id;
                initialUpdateCheckHandled.current = true;
                break;
            }
            case 'download-progress': {
                if (currentToastId) {
                    updateToast(currentToastId, {
                        message: `Download in progress...`,
                        progress: Math.round(data as number)
                    });
                }
                break;
            }
            case 'update-downloaded': {
                const downloadedInfo = data as UpdateInfo;
                const commonProps = {
                    type: 'success' as const,
                    title: `Update Ready: v${downloadedInfo.version}`,
                    message: 'Restart the application to install the latest version.',
                    progress: undefined,
                    actions: [{ label: 'Restart Now', onClick: () => window.electronAPI.restartAndInstall() }]
                };
                if (currentToastId) {
                    updateToast(currentToastId, commonProps);
                } else {
                    const newId = addToast(commonProps);
                    updateToastIdRef.current = newId;
                }
                initialUpdateCheckHandled.current = true;
                break;
            }
            case 'update-not-available':
                if (initialUpdateCheckHandled.current) {
                    addToast({ type: 'success', title: 'Up to Date', message: 'You are running the latest version.', duration: 3000 });
                }
                initialUpdateCheckHandled.current = true;
                break;
            
            case 'error':
                 addToast({ type: 'error', title: 'Update Error', message: data as string, duration: 8000 });
                 initialUpdateCheckHandled.current = true;
                break;
        }
    });

    return unsubscribe;
  }, []);

  const callLlm = useCallback(async (systemPrompt: string, userPrompt: string, isResponseTextFreeform = false): Promise<any> => {
    if (!appSettings?.aiSettings.baseUrl || !appSettings?.aiSettings.model) {
      const errorMsg = "AI settings are not configured. Please configure them in the settings menu.";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const { provider, baseUrl, model } = appSettings.aiSettings;
    let endpoint = '';
    let body: any = {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // Deprecated but good fallback

    if (provider === 'ollama') {
      endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;
      body = { model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], stream: false };
      if (!isResponseTextFreeform) body.format = 'json';
    } else { // lmstudio (openai-compatible)
      endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      body = { model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], stream: false };
    }
    
    logger.info(`Calling LLM at ${endpoint}`, { provider, model });
    logger.debug('LLM request body:', body);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000) // Modern timeout
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `AI API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      logger.debug('LLM response data received.');

      const contentString: string = provider === 'ollama' ? data.message.content : data.choices[0].message.content;

      if (isResponseTextFreeform) {
          logger.info('Successfully received freeform LLM response.');
          return contentString;
      }
      
      let textToParse = contentString.trim();
      
      const markdownMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        logger.debug('Extracted JSON from markdown code block.');
        textToParse = markdownMatch[1].trim();
      }

      try {
        const parsedJson = JSON.parse(textToParse);
        logger.info('Successfully received and parsed LLM response.');
        return parsedJson;
      } catch (error: any) {
        logger.error('Failed to parse JSON from AI response', { errorMessage: error.message, content: textToParse });
        throw new Error(`The AI returned invalid JSON. Response snippet: ${textToParse.substring(0, 150)}...`);
      }

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            const timeoutMessage = "AI API request timed out after 90 seconds. Please check if the service is running and the model is loaded.";
            logger.error(timeoutMessage);
            throw new Error(timeoutMessage);
        }
        const errorMessage = error.message || 'An unknown network error occurred.';
        logger.error("Error calling LLM:", { message: errorMessage });
        throw new Error(errorMessage);
    }
  }, [appSettings]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleCategoryOrderChange = (newCategories: Category[]) => {
    setCategories(newCategories);
  };
  
  const handleToggleTag = useCallback((tag: Tag) => {
    const isCurrentlySelected = !!selectedTags[tag.id];

    if (!isCurrentlySelected) {
      const conflict = tag.conflictsWith?.find(id => selectedTags[id]);
      if (conflict) {
        const conflictingTag = selectedTags[conflict];
        logger.warn('Tag conflict detected.', { newTag: tag.label, existingTag: conflictingTag.label });
        setConflictState({ newlySelectedTag: tag, conflictingTag });
        return; 
      }
    }

    logger.debug(`Toggling tag: ${tag.label}`, { selected: !isCurrentlySelected });
    setSelectedTags(prev => {
      const newSelected = { ...prev };
      if (newSelected[tag.id]) {
        delete newSelected[tag.id];
      } else {
        const categoryId = taxonomyMap.get(tag.id)?.categoryId;
        if (categoryId) {
          newSelected[tag.id] = { ...tag, categoryId };
        }
      }
      return newSelected;
    });
  }, [selectedTags, taxonomyMap]);

  const handleResolveConflict = (keepNew: boolean) => {
    if (!conflictState) return;
    logger.info('Resolving tag conflict.', { keptNew: keepNew, newTag: conflictState.newlySelectedTag.label, oldTag: conflictState.conflictingTag.label });
    if (keepNew) {
      const { newlySelectedTag, conflictingTag } = conflictState;
      setSelectedTags(prev => {
        const newSelected = { ...prev };
        delete newSelected[conflictingTag.id];
        const categoryId = taxonomyMap.get(newlySelectedTag.id)?.categoryId;
        if (categoryId) newSelected[newlySelectedTag.id] = { ...newlySelectedTag, categoryId };
        return newSelected;
      });
    }
    setConflictState(null);
  };
  
  const handleTextCategoryChange = (categoryId: string, value: string) => {
      setTextCategoryValues(prev => ({ ...prev, [categoryId]: value }));
  };
  
  const handleLoadPreset = useCallback((preset: Preset) => {
    logger.info(`Loading preset: ${preset.name}`);
    const newSelectedTags: Record<string, SelectedTag> = {};
    Object.entries(preset.selectedTags).forEach(([tagId, data]) => {
      const fullTag = taxonomyMap.get(tagId);
      if (fullTag) newSelectedTags[tagId] = { ...fullTag, ...data };
      else logger.warn('Tag from preset not found.', { tagId });
    });

    setSelectedTags(newSelectedTags);
    setTextCategoryValues({});
    setUdioParams(preset.udioParams || { instrumental: false });
    setCategories(prevCategories => {
        const presetCategoryMap = new Map(prevCategories.map(c => [c.id, c]));
        const ordered = preset.categoryOrder.map(id => presetCategoryMap.get(id)).filter((c): c is Category => !!c);
        const remaining = prevCategories.filter(c => !preset.categoryOrder.includes(c.id));
        return [...ordered, ...remaining];
    });
  }, [taxonomyMap]);

  const handleSavePreset = (name: string): boolean => {
    if (!name || !appSettings) return false;
    if (appSettings.presets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        logger.error(`A preset with the name "${name}" already exists.`);
        setAlert({
            title: "Duplicate Preset Name",
            message: `A preset with the name "${name}" already exists. Please choose a different name.`,
            variant: 'error',
        });
        return false;
    }
    
    logger.info(`Saving new preset: ${name}`);
    const selectedTagsForPreset: Preset['selectedTags'] = {};
    Object.entries(selectedTags).forEach(([id, tag]) => {
        selectedTagsForPreset[id] = { categoryId: tag.categoryId };
    });

    const newPreset: Preset = { name, selectedTags: selectedTagsForPreset, categoryOrder: categories.map(c => c.id), udioParams };
    setAppSettings(prev => prev ? { ...prev, presets: [...prev.presets, newPreset] } : null);
    return true;
  };

  const handleUpdatePreset = (presetName: string) => {
    logger.info(`Updating preset: ${presetName}`);
    if (!appSettings) return;

    const selectedTagsForPreset: Preset['selectedTags'] = {};
    Object.entries(selectedTags).forEach(([id, tag]) => {
      selectedTagsForPreset[id] = { categoryId: tag.categoryId };
    });
    
    const categoryOrder = categories.map(c => c.id);

    const updatedPresets = appSettings.presets.map(p => {
        if (p.name === presetName) {
            return { ...p, selectedTags: selectedTagsForPreset, categoryOrder, udioParams };
        }
        return p;
    });

    setAppSettings({ ...appSettings, presets: updatedPresets });
  };
  
  const handleRenamePreset = (oldName: string, newName: string): boolean => {
      if (!newName || !appSettings) return false;
      if (oldName.toLowerCase() !== newName.toLowerCase() && appSettings.presets.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
          logger.error(`A preset with the name "${newName}" already exists.`);
          setAlert({
              title: "Duplicate Preset Name",
              message: `A preset with the name "${newName}" already exists. Please choose a different name.`,
              variant: 'error',
          });
          return false;
      }

      logger.info(`Renaming preset "${oldName}" to "${newName}"`);
      const renamedPresets = appSettings.presets.map(p => p.name === oldName ? { ...p, name: newName } : p);
      setAppSettings({ ...appSettings, presets: renamedPresets });
      return true;
  };

  const handleDeletePreset = (presetName: string) => {
    logger.info(`Deleting preset: ${presetName}`);
    if (!appSettings) return;
    const filteredPresets = appSettings.presets.filter(p => p.name !== presetName);
    setAppSettings({ ...appSettings, presets: filteredPresets });
  };
  
  const handleSimpleRandomize = useCallback(() => {
    logger.info('Randomizing tags.');
    const newSelected: Record<string, SelectedTag> = {};
    categories.forEach(category => {
        if(category.tags.length > 0 && category.type !== 'text') {
            const randomTag = category.tags[Math.floor(Math.random() * category.tags.length)];
            const fullTag = taxonomyMap.get(randomTag.id);
            if(fullTag) newSelected[randomTag.id] = fullTag;
        }
    });
    setSelectedTags(newSelected);
    setTextCategoryValues({});
    setUdioParams({ instrumental: false });
  }, [categories, taxonomyMap]);

  const handleClearCategoryTags = useCallback((categoryId: string) => {
    logger.info(`Clearing tags for category: ${categoryId}`);
    setSelectedTags(prev => {
        const newSelected = { ...prev };
        Object.keys(newSelected).forEach(tagId => {
            if (newSelected[tagId].categoryId === categoryId) delete newSelected[tagId];
        });
        return newSelected;
    });
  }, []);
  
  const handlePromptPanelResize = (ratio: number) => {
    setAppSettings(prev => prev ? ({ ...prev, promptPanelRatio: ratio }) : null);
  };

  const handlePromptGenerated = useCallback((data: Omit<HistoryEntry, 'timestamp'>) => {
    setHistory(prevHistory => {
        const lastEntry = prevHistory[0];
        // Avoid adding duplicate entries if nothing significant has changed
        if (lastEntry &&
            lastEntry.promptString === data.promptString &&
            JSON.stringify(lastEntry.selectedTags) === JSON.stringify(data.selectedTags) &&
            JSON.stringify(lastEntry.textCategoryValues) === JSON.stringify(data.textCategoryValues) &&
            JSON.stringify(lastEntry.udioParams) === JSON.stringify(data.udioParams)
        ) {
            return prevHistory;
        }

        const newEntry: HistoryEntry = {
            ...data,
            timestamp: new Date().toISOString(),
        };
        const newHistory = [newEntry, ...prevHistory].slice(0, 50);
        return newHistory;
    });
  }, [setHistory]);

  const handleLoadFromHistory = useCallback((entry: HistoryEntry) => {
      logger.info(`Loading prompt from history (timestamp: ${entry.timestamp})`);
      const newSelectedTags: Record<string, SelectedTag> = {};
      Object.entries(entry.selectedTags).forEach(([tagId, data]) => {
          const fullTag = taxonomyMap.get(tagId);
          if (fullTag) newSelectedTags[tagId] = { ...fullTag, ...data };
      });

      setSelectedTags(newSelectedTags);
      setTextCategoryValues(entry.textCategoryValues);
      setUdioParams(entry.udioParams || { instrumental: false });
      setCategories(prevCategories => {
          const historyCategoryMap = new Map(prevCategories.map(c => [c.id, c]));
          const ordered = entry.categoryOrder.map(id => historyCategoryMap.get(id)).filter((c): c is Category => !!c);
          const remaining = prevCategories.filter(c => !entry.categoryOrder.includes(c.id));
          return [...ordered, ...remaining];
      });
      setIsHistoryModalOpen(false);
  }, [taxonomyMap]);

  const handleClearHistory = () => {
      logger.info('Clearing prompt history.');
      setHistory([]);
  };

  const handleDeconstruct = useCallback(async (prompt: string): Promise<boolean> => {
    logger.info("Deconstructing prompt with AI...", { prompt });

    const systemPrompt = `You are an expert at analyzing music descriptions and mapping them to a predefined taxonomy of tags. Your task is to identify which tags from the provided list best represent the user's prompt.

- You will be given the user's prompt and a complete list of available tags.
- Each tag in the list has a unique 'id' and a descriptive 'label'.
- Your response MUST be a valid JSON object.
- The JSON object must have a single key: "tag_ids".
- The value of "tag_ids" must be an array of strings, where each string is the 'id' of a matched tag from the provided list.
- Only include IDs of tags that are explicitly mentioned or strongly implied in the prompt. Do not infer tags that are not present.
- Do not include any text, explanations, or markdown formatting outside of the JSON object itself.

Example: If the prompt is "a dreamy synthwave track" and the tag list contains { id: 'g_synthwave', label: 'Synthwave' } and { id: 'm_dreamy', label: 'Dreamy' }, your response should be:
{
  "tag_ids": ["g_synthwave", "m_dreamy"]
}`;

    const userPrompt = `User Prompt: "${prompt}"

Available Tags:
${JSON.stringify(allTags.map(({ id, label, description }) => ({ id, label, description })), null, 2)}`;

    try {
        const result = await callLlm(systemPrompt, userPrompt);
        if (result && Array.isArray(result.tag_ids)) {
            logger.info("AI deconstruction successful.", { tag_ids: result.tag_ids });
            const newSelectedTags: Record<string, SelectedTag> = {};
            result.tag_ids.forEach((tagId: string) => {
                const fullTag = taxonomyMap.get(tagId);
                if (fullTag) {
                    newSelectedTags[tagId] = fullTag;
                } else {
                    logger.warn("AI returned a tag ID not found in taxonomy.", { tagId });
                }
            });
            
            handleClear(); 
            setSelectedTags(newSelectedTags);

            return true;
        } else {
            logger.error("AI returned an invalid response format for deconstruction.", { response: result });
            throw new Error("The AI returned an invalid response. Please try again.");
        }
    } catch (e: any) {
        logger.error("Error during prompt deconstruction:", { error: e.message });
        throw e;
    }
  }, [allTags, callLlm, taxonomyMap, handleClear]);

  const handleThematicRandomize = useCallback(async (theme: string): Promise<boolean> => {
    logger.info("Generating tags from theme with AI...", { theme });

    const systemPrompt = `You are a creative music director AI. Your task is to select a cohesive set of tags from a provided list that best captures a user's theme.
- You will be given the user's theme and a complete list of available tags.
- Each tag has a unique 'id' and a 'label'.
- Your response MUST be a valid JSON object.
- The JSON object must have a single key: "tag_ids".
- The value of "tag_ids" must be an array of strings, where each string is the 'id' of a selected tag from the provided list.
- Select a reasonable number of tags (e.g., 5-15) that create a well-rounded and interesting musical idea covering different categories like genre, mood, and instruments.
- Do not include any text, explanations, or markdown formatting outside of the JSON object itself.

Example: If the theme is "80s sci-fi movie car chase" your response might be:
{
  "tag_ids": ["g_synthwave", "era_80s", "m_driving", "m_suspenseful", "i_layered_synths", "cs_linndrum"]
}`;

    const userPrompt = `User Theme: "${theme}"

Available Tags:
${JSON.stringify(allTags.map(({ id, label, description }) => ({ id, label, description })), null, 2)}`;

    try {
        const result = await callLlm(systemPrompt, userPrompt);
        if (result && Array.isArray(result.tag_ids)) {
            logger.info("AI thematic generation successful.", { tag_ids: result.tag_ids });
            const newSelectedTags: Record<string, SelectedTag> = {};
            result.tag_ids.forEach((tagId: string) => {
                const fullTag = taxonomyMap.get(tagId);
                if (fullTag) {
                    newSelectedTags[tagId] = fullTag;
                } else {
                    logger.warn("AI returned a tag ID not found in taxonomy.", { tagId });
                }
            });
            
            handleClear(); 
            setSelectedTags(newSelectedTags);

            return true;
        } else {
            logger.error("AI returned an invalid response format for thematic generation.", { response: result });
            throw new Error("The AI returned an invalid response. Please try again.");
        }
    } catch (e: any) {
        logger.error("Error during thematic tag generation:", { error: e.message });
        throw e;
    }
  }, [allTags, callLlm, taxonomyMap, handleClear]);

  const activeCategory = useMemo(() => categories.find(c => c.id === activeCategoryId), [categories, activeCategoryId]);

  const selectedTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(selectedTags).forEach(tag => {
      counts[tag.categoryId] = (counts[tag.categoryId] || 0) + 1;
    });
     Object.entries(textCategoryValues).forEach(([catId, value]) => {
        if(value) counts[catId] = (counts[catId] || 0) + 1;
    })
    return counts;
  }, [selectedTags, textCategoryValues]);

  const conflicts = useMemo(() => {
    const newConflicts: Conflict[] = [];
    const selectedList = Object.values(selectedTags);

    for (const tagA of selectedList) {
        if (tagA.conflictsWith) {
            for (const conflictId of tagA.conflictsWith) {
                if (selectedTags[conflictId]) {
                    const tagB = selectedTags[conflictId];
                    if (tagA.id < tagB.id) newConflicts.push({ tagA, tagB });
                }
            }
        }
    }
    return newConflicts;
  }, [selectedTags]);
  
  if (isLoading || !appSettings || !taxonomy) {
    return (
        <div className="flex items-center justify-center h-full w-full bg-white dark:bg-bunker-950 text-bunker-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4">
            <h1 className="text-2xl font-bold mb-2">Application Error</h1>
            <p className="text-center">{error}</p>
        </div>
    );
  }

  const crafterView = (
      <ResizablePanels sizes={panelSizes} onResize={setPanelSizes} minSize={15}>
          <div className="h-full">
            <CategoryList
              categories={categories}
              activeCategoryId={activeCategoryId}
              selectedTagCounts={selectedTagCounts}
              onSelectCategory={setActiveCategoryId}
              onCategoryOrderChange={handleCategoryOrderChange}
            />
          </div>
          <div className="h-full overflow-y-auto">
            <TagPicker
              category={activeCategory}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              textCategoryValues={textCategoryValues}
              onTextCategoryChange={handleTextCategoryChange}
              onClearCategoryTags={handleClearCategoryTags}
              taxonomyMap={taxonomyMap}
              callLlm={callLlm}
            />
          </div>
          <div className="h-full">
            <PromptPreview 
              orderedCategories={categories}
              selectedTags={selectedTags}
              textCategoryValues={textCategoryValues}
              conflicts={conflicts}
              callLlm={callLlm}
              promptPanelRatio={appSettings.promptPanelRatio ?? 50}
              onPromptPanelResize={handlePromptPanelResize}
              onPromptGenerated={handlePromptGenerated}
              udioParams={udioParams}
              onUdioParamsChange={setUdioParams}
            />
          </div>
      </ResizablePanels>
  );
  
  const renderActiveView = () => {
    switch (activeView) {
      case 'settings':
        return (
          <div className="h-full overflow-y-auto">
            <SettingsPage 
              appVersion={appVersion}
              taxonomy={taxonomy}
              onTaxonomyChange={handleTaxonomyChange}
              defaultPresets={starterPresets}
              detectedProviders={detectedProviders}
              availableModels={availableModels}
              isDetecting={isDetecting}
              onRefresh={detectServicesAndFetchModels}
            />
          </div>
        );
      case 'info':
        return (
          <div className="h-full overflow-y-auto">
              <InfoPage />
          </div>
        );
      case 'crafter':
      default:
        return isLogPanelOpen ? (
          <ResizableVerticalPanel
            height={logPanelHeight}
            onResize={setLogPanelHeight}
            minHeight={80}
          >
            <div className="h-full min-h-0">
              {crafterView}
            </div>
            <LogPanel onClose={() => setIsLogPanelOpen(false)} />
          </ResizableVerticalPanel>
        ) : (
          <div className="flex-grow min-h-0">
            {crafterView}
          </div>
        );
    }
  };

  return (
    <SettingsContext.Provider value={{ settings: appSettings, setSettings: setAppSettings }}>
      <div className="h-full w-full flex flex-col font-sans bg-bunker-50 dark:bg-bunker-950 text-bunker-900 dark:text-bunker-200">
        <Header 
          theme={theme} 
          activeView={activeView}
          onSetView={setActiveView}
          onToggleTheme={toggleTheme}
          onOpenSavePresetModal={() => setIsSavePresetModalOpen(true)}
          onOpenPresetManagerModal={() => setIsPresetManagerModalOpen(true)}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
          onOpenDeconstructModal={() => setIsDeconstructModalOpen(true)}
          onOpenThematicRandomizerModal={() => setIsThematicRandomizerModalOpen(true)}
          onClear={handleClear}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleLogPanel={() => setIsLogPanelOpen(prev => !prev)}
        />
        <main className="flex-grow flex flex-col min-h-0">
          {renderActiveView()}
        </main>
        <StatusBar 
          appVersion={appVersion}
          tagCount={Object.keys(selectedTags).length}
          conflictCount={conflicts.length}
          aiStatus={aiStatus}
        />
        {conflictState && (
          <ConflictResolutionModal
            conflict={conflictState}
            onResolve={handleResolveConflict}
          />
        )}
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          tags={allTags}
          presets={appSettings.presets}
          onToggleTag={handleToggleTag}
          onLoadPreset={handleLoadPreset}
          onSavePreset={() => setIsSavePresetModalOpen(true)}
          onRandomize={handleSimpleRandomize}
          onClear={handleClear}
        />
        <SavePresetModal
          isOpen={isSavePresetModalOpen}
          onClose={() => setIsSavePresetModalOpen(false)}
          onSave={handleSavePreset}
        />
        <PresetManagerModal
          isOpen={isPresetManagerModalOpen}
          onClose={() => setIsPresetManagerModalOpen(false)}
          presets={appSettings.presets}
          onLoadPreset={(preset) => {
              handleLoadPreset(preset);
              setIsPresetManagerModalOpen(false);
          }}
          onUpdatePreset={handleUpdatePreset}
          onDeletePreset={handleDeletePreset}
          onRenamePreset={handleRenamePreset}
        />
        <PromptHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          history={history}
          onLoad={handleLoadFromHistory}
          onClear={handleClearHistory}
        />
        <DeconstructPromptModal
          isOpen={isDeconstructModalOpen}
          onClose={() => setIsDeconstructModalOpen(false)}
          onDeconstruct={handleDeconstruct}
        />
        <ThematicRandomizerModal
          isOpen={isThematicRandomizerModalOpen}
          onClose={() => setIsThematicRandomizerModalOpen(false)}
          onThematicRandomize={handleThematicRandomize}
        />
        {alert && (
            <AlertModal 
                isOpen={true}
                onClose={() => setAlert(null)}
                title={alert.title}
                message={alert.message}
                variant={alert.variant}
            />
        )}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    </SettingsContext.Provider>
  );
};

export default App;