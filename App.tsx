import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterPresets } from './data/presets';
import type { Tag, Category, SelectedTag, Preset, Conflict, Taxonomy, AppSettings, AiStatus } from './types';
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

interface ConflictState {
  newlySelectedTag: Tag;
  conflictingTag: Tag;
}

const isElectron = !!window.electronAPI;

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [panelSizes, setPanelSizes] = useLocalStorage('panel-sizes', [20, 45, 35]);
  const [logPanelHeight, setLogPanelHeight] = useLocalStorage('log-panel-height', 288);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<'crafter' | 'settings' | 'info'>('crafter');
  
  // State for global features like status bar
  const [appVersion, setAppVersion] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatus>('checking');
  const [detectedProviders, setDetectedProviders] = useState<('ollama' | 'lmstudio')[]>([]);
  const [availableModels, setAvailableModels] = useState<{ ollama: string[]; lmstudio: string[] }>({ ollama: [], lmstudio: [] });
  const [isDetecting, setIsDetecting] = useState(false);
  
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
        setAppSettings({
          presets: storedPresets ? JSON.parse(storedPresets) : starterPresets,
          aiSettings: storedAiSettings ? JSON.parse(storedAiSettings) : {
            provider: 'ollama',
            baseUrl: 'http://localhost:11434',
            model: 'llama3',
          },
        });
      }
    };
    
    const loadTaxonomy = fetch('./taxonomy.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load taxonomy. Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        logger.info("Taxonomy loaded successfully.");
        setTaxonomy(data.taxonomy);
      })
      .catch(e => {
        console.error("Failed to load taxonomy.json:", e);
        const errorMessage = "Could not load the core taxonomy configuration. The application cannot start.";
        logger.error(errorMessage, { error: e.message });
        setError(errorMessage);
      });

    Promise.all([loadAppSettings(), loadTaxonomy]).then(() => {
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
    }
  }, [appSettings]);
  
  const { taxonomyMap, allTags, initialCategories } = useMemo(() => {
    if (!taxonomy) {
      return { taxonomyMap: new Map(), allTags: [], initialCategories: [] };
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
    return { taxonomyMap: newTaxonomyMap, allTags: allT, initialCategories: taxonomy };
  }, [taxonomy]);

  useEffect(() => {
      if(initialCategories.length > 0 && categories.length === 0) {
          setCategories(initialCategories);
          if (!activeCategoryId) {
            setActiveCategoryId(initialCategories[0].id);
          }
          logger.debug('Initial categories set.');
      }
  }, [initialCategories, categories, activeCategoryId]);


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
  
  const callLlm = useCallback(async (systemPrompt: string, userPrompt: string): Promise<any> => {
    if (!appSettings?.aiSettings.baseUrl || !appSettings?.aiSettings.model) {
      const errorMsg = "AI settings are not configured. Please configure them in the settings menu.";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const { provider, baseUrl, model } = appSettings.aiSettings;
    let endpoint = '';
    let body: any = {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    if (provider === 'ollama') {
      endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;
      body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        format: 'json',
        stream: false,
      };
    } else { // lmstudio (openai-compatible)
      endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      };
    }
    
    logger.info(`Calling LLM at ${endpoint}`, { provider });
    logger.debug('LLM request body:', body);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `AI API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      logger.debug('LLM response data:', data);

      let contentString: string = provider === 'ollama' ? data.message.content : data.choices[0].message.content;
      let textToParse = contentString.trim();
      
      const markdownMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        textToParse = markdownMatch[1].trim();
      }

      const firstBrace = textToParse.indexOf('{');
      const firstBracket = textToParse.indexOf('[');
      let startIndex = -1;
      if (firstBrace === -1) startIndex = firstBracket;
      else if (firstBracket === -1) startIndex = firstBrace;
      else startIndex = Math.min(firstBrace, firstBracket);

      if (startIndex === -1) throw new Error('AI response did not contain a valid JSON object or array.');
      
      const lastBrace = textToParse.lastIndexOf('}');
      const lastBracket = textToParse.lastIndexOf(']');
      const endIndex = Math.max(lastBrace, lastBracket);

      if (endIndex === -1) throw new Error('AI response has a malformed JSON object (no closing brace/bracket).');
      
      const jsonSubstring = textToParse.substring(startIndex, endIndex + 1);

      try {
        const parsedJson = JSON.parse(jsonSubstring);
        logger.info('Successfully received and parsed LLM response.');
        return parsedJson;
      } catch (error: any) {
        logger.error('Failed to parse extracted JSON from AI response', { errorMessage: error.message, extractedJson: jsonSubstring });
        throw new Error(`Error: ${error.message}. The AI returned the following invalid JSON: ${jsonSubstring.substring(0, 100)}...`);
      }

    } catch (error: any) {
        clearTimeout(timeoutId);
        const errorMessage = error.name === 'AbortError' ? "AI API request timed out after 90 seconds." : error.message;
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
    setCategories(prevCategories => {
        const presetCategoryMap = new Map(prevCategories.map(c => [c.id, c]));
        const ordered = preset.categoryOrder.map(id => presetCategoryMap.get(id)).filter((c): c is Category => !!c);
        const remaining = prevCategories.filter(c => !preset.categoryOrder.includes(c.id));
        return [...ordered, ...remaining];
    });
  }, [taxonomyMap]);

  const handleSavePreset = () => {
    const name = prompt("Enter a name for your preset:");
    if (name && appSettings) {
      logger.info(`Saving new preset: ${name}`);
      const selectedTagsForPreset: Preset['selectedTags'] = {};
      Object.entries(selectedTags).forEach(([id, tag]) => {
          selectedTagsForPreset[id] = { categoryId: tag.categoryId };
      });

      const newPreset: Preset = { name, selectedTags: selectedTagsForPreset, categoryOrder: categories.map(c => c.id) };
      setAppSettings(prev => prev ? { ...prev, presets: [...prev.presets, newPreset] } : null);
    }
  };
  
  const handleRandomize = useCallback(() => {
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
  }, [categories, taxonomyMap]);

  const handleClear = () => {
    logger.info('Clearing all selected tags and text.');
    setSelectedTags({});
    setTextCategoryValues({});
  };

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
  
  if (isLoading || !appSettings) {
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
              settings={appSettings}
              onSettingsChange={setAppSettings}
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
    <div className="h-full w-full flex flex-col font-sans bg-white dark:bg-bunker-950 text-bunker-900 dark:text-bunker-200 transition-colors duration-300">
      <Header 
        theme={theme} 
        presets={appSettings.presets}
        activeView={activeView}
        onSetView={setActiveView}
        onToggleTheme={toggleTheme}
        onLoadPreset={handleLoadPreset}
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
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
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
        onClear={handleClear}
      />
    </div>
  );
};

export default App;