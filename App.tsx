import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterPresets } from './data/presets';
import { starterMacros } from './data/macros';
import type { Tag, Category, SelectedTag, Preset, Conflict, Macro, Taxonomy, AiSettings } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { CommandPalette } from './components/CommandPalette';
import { ResizablePanels } from './components/ResizablePanels';
import { SettingsModal } from './components/SettingsModal';
import { DeconstructPromptModal } from './components/DeconstructPromptModal';

interface ConflictState {
  newlySelectedTag: Tag;
  conflictingTag: Tag;
}

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [presets, setPresets] = useLocalStorage<Preset[]>('user-presets', starterPresets);
  const [panelSizes, setPanelSizes] = useLocalStorage('panel-sizes', [20, 45, 35]);
  const [aiSettings, setAiSettings] = useLocalStorage<AiSettings>('ai-settings', {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
  });
  
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeconstructModalOpen, setIsDeconstructModalOpen] = useState(false);
  
  // State for AI service detection
  const [detectedProviders, setDetectedProviders] = useState<('ollama' | 'lmstudio')[]>([]);
  const [availableModels, setAvailableModels] = useState<{ ollama: string[]; lmstudio: string[] }>({ ollama: [], lmstudio: [] });
  const [isDetecting, setIsDetecting] = useState(false);


  useEffect(() => {
    fetch('./taxonomy.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load taxonomy configuration file. Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setTaxonomy(data.taxonomy);
      })
      .catch(e => {
        console.error("Failed to load taxonomy.json:", e);
        setError("Could not load the core taxonomy configuration. The application cannot start.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
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
    return { taxonomyMap: newTaxonomyMap, allTags: allT, initialCategories: taxonomy };
  }, [taxonomy]);

  useEffect(() => {
      if(initialCategories.length > 0 && categories.length === 0) {
          setCategories(initialCategories);
          setActiveCategoryId(initialCategories[0].id);
      }
  }, [initialCategories, categories]);


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

  const detectServicesAndFetchModels = useCallback(async () => {
    setIsDetecting(true);
    const newDetected: ('ollama' | 'lmstudio')[] = [];
    const newModels: { ollama: string[]; lmstudio: string[] } = { ollama: [], lmstudio: [] };

    // Detect Ollama
    try {
        const ollamaRes = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
        if (ollamaRes.ok) {
            const data = await ollamaRes.json();
            newDetected.push('ollama');
            if (data.models) {
                newModels.ollama = data.models.map((m: any) => m.name).sort();
            }
        }
    } catch (e) { /* Ollama not found or timed out */ }

    // Detect LM Studio
    try {
        const lmStudioRes = await fetch('http://localhost:1234/v1/models', { signal: AbortSignal.timeout(2000) });
        if (lmStudioRes.ok) {
            const data = await lmStudioRes.json();
            newDetected.push('lmstudio');
            if (data.data) {
                newModels.lmstudio = data.data.map((m: any) => m.id).sort();
            }
        }
    } catch (e) { /* LM Studio not found or timed out */ }

    setDetectedProviders(newDetected);
    setAvailableModels(newModels);
    setIsDetecting(false);

    // Auto-switch provider if the currently saved one isn't detected
    if (newDetected.length > 0 && !newDetected.includes(aiSettings.provider)) {
        const newProvider = newDetected[0];
        const newBaseUrl = newProvider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234';
        const newModel = newModels[newProvider][0] || '';
        setAiSettings({ provider: newProvider, baseUrl: newBaseUrl, model: newModel });
    }
  }, [aiSettings.provider, setAiSettings]);

  useEffect(() => {
    if (isSettingsModalOpen) {
        detectServicesAndFetchModels();
    }
  }, [isSettingsModalOpen, detectServicesAndFetchModels]);

  const callLlm = useCallback(async (systemPrompt: string, userPrompt: string): Promise<any> => {
    if (!aiSettings.baseUrl || !aiSettings.model) {
      throw new Error("AI settings are not configured. Please configure them in the settings menu.");
    }

    let endpoint = '';
    let body: any = {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    if (aiSettings.provider === 'ollama') {
      endpoint = `${aiSettings.baseUrl.replace(/\/$/, '')}/api/generate`;
      body = {
        model: aiSettings.model,
        system: systemPrompt,
        prompt: userPrompt,
        format: 'json',
        stream: false,
      };
    } else { // lmstudio (openai-compatible)
      endpoint = `${aiSettings.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
      body = {
        model: aiSettings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        stream: false,
      };
    }
    
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
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }
      
      const data = await response.json();

      let jsonString: string;
      if (aiSettings.provider === 'ollama') {
        jsonString = data.response;
      } else {
        jsonString = data.choices[0].message.content;
      }
      
      // The response might be a markdown block, so we need to extract the JSON
      const jsonMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
      const cleanJsonString = jsonMatch ? jsonMatch[1] : jsonString;

      return JSON.parse(cleanJsonString);

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error("AI API request timed out after 30 seconds.");
        }
        console.error("Error calling LLM:", error);
        throw error;
    }
}, [aiSettings]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleCategoryOrderChange = (newCategories: Category[]) => {
    setCategories(newCategories);
  };
  
  const handleToggleTag = useCallback((tag: Tag) => {
    const isCurrentlySelected = !!selectedTags[tag.id];

    if (!isCurrentlySelected) {
      let conflict: Tag | null = null;
      if (tag.conflictsWith) {
        for (const conflictId of tag.conflictsWith) {
          if (selectedTags[conflictId]) {
            conflict = selectedTags[conflictId];
            break;
          }
        }
      }

      if (conflict) {
        setConflictState({
          newlySelectedTag: tag,
          conflictingTag: conflict,
        });
        return; 
      }
    }

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

    if (keepNew) {
      const { newlySelectedTag, conflictingTag } = conflictState;
      setSelectedTags(prev => {
        const newSelected = { ...prev };
        delete newSelected[conflictingTag.id];
        const categoryId = taxonomyMap.get(newlySelectedTag.id)?.categoryId;
        if (categoryId) {
          newSelected[newlySelectedTag.id] = { ...newlySelectedTag, categoryId };
        }
        return newSelected;
      });
    }
    setConflictState(null);
  };
  
  const handleTextCategoryChange = (categoryId: string, value: string) => {
      setTextCategoryValues(prev => ({ ...prev, [categoryId]: value }));
  };

  const loadTagsFromList = useCallback((tagIds: string[], replace = true) => {
      const newSelectedTags: Record<string, SelectedTag> = replace ? {} : {...selectedTags};
      tagIds.forEach(tagId => {
          const fullTag = taxonomyMap.get(tagId);
          if (fullTag) {
              newSelectedTags[tagId] = { ...fullTag };
          }
      });
      setSelectedTags(newSelectedTags);
  }, [taxonomyMap, selectedTags]);


  const handleApplyMacro = useCallback((macro: Macro) => {
    loadTagsFromList(macro.tags);
    setTextCategoryValues({});
  }, [loadTagsFromList]);

  const handleLoadPreset = useCallback((preset: Preset) => {
    const newSelectedTags: Record<string, SelectedTag> = {};
    Object.entries(preset.selectedTags).forEach(([tagId, data]) => {
      const fullTag = taxonomyMap.get(tagId);
      if (fullTag) {
        newSelectedTags[tagId] = { ...fullTag, ...data };
      }
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
    if (name) {
      const selectedTagsForPreset: Preset['selectedTags'] = {};
      Object.entries(selectedTags).forEach(([id, tag]) => {
          selectedTagsForPreset[id] = { categoryId: tag.categoryId };
      });

      const newPreset: Preset = {
        name,
        selectedTags: selectedTagsForPreset,
        categoryOrder: categories.map(c => c.id)
      };
      setPresets(prev => [...prev, newPreset]);
    }
  };
  
  const handleRandomize = useCallback(() => {
    const newSelected: Record<string, SelectedTag> = {};
    categories.forEach(category => {
        if(category.tags.length > 0 && category.type !== 'text') {
            const randomTag = category.tags[Math.floor(Math.random() * category.tags.length)];
            const fullTag = taxonomyMap.get(randomTag.id);
            if(fullTag) {
                 newSelected[randomTag.id] = fullTag;
            }
        }
    });
    setSelectedTags(newSelected);
    setTextCategoryValues({});
  }, [categories, taxonomyMap]);

  const handleClear = () => {
    setSelectedTags({});
    setTextCategoryValues({});
  };

  const handleClearCategoryTags = useCallback((categoryId: string) => {
    setSelectedTags(prev => {
        const newSelected = { ...prev };
        Object.keys(newSelected).forEach(tagId => {
            if (newSelected[tagId].categoryId === categoryId) {
                delete newSelected[tagId];
            }
        });
        return newSelected;
    });
  }, []);

  const handleDeconstructPrompt = useCallback(async (prompt: string) => {
    const systemPrompt = `You are an expert musicologist AI. Your task is to analyze a user's prompt and map it to a predefined list of tags. You will be given a JSON object of available tags. You must return a JSON object with a single key 'tagIds' which is an array of strings, where each string is the ID of a tag that accurately represents the user's prompt. Only select tags from the provided list. Do not hallucinate new tags.`;
    const userPrompt = `User Prompt: "${prompt}". Available Tags: ${JSON.stringify(allTags.map(({id, label, description, synonyms}) => ({id, label, description, synonyms})))}`;

    const result = await callLlm(systemPrompt, userPrompt);
    if (result && Array.isArray(result.tagIds)) {
        loadTagsFromList(result.tagIds, true);
        return true;
    }
    throw new Error("AI returned an invalid response format.");
  }, [callLlm, allTags, loadTagsFromList]);
  
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
                    if (tagA.id < tagB.id) {
                         newConflicts.push({ tagA, tagB });
                    }
                }
            }
        }
    }
    return newConflicts;
  }, [selectedTags]);
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-white dark:bg-bunker-950 text-bunker-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading configuration...
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4">
            <h1 className="text-2xl font-bold mb-2">Application Error</h1>
            <p className="text-center">{error}</p>
        </div>
    );
  }


  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-white dark:bg-bunker-950 text-bunker-900 dark:text-bunker-200 transition-colors duration-300">
      <Header 
        theme={theme} 
        presets={presets}
        macros={starterMacros}
        onToggleTheme={toggleTheme}
        onLoadPreset={handleLoadPreset}
        onApplyMacro={handleApplyMacro}
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
        onClear={handleClear}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAiAssist={() => setIsDeconstructModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />
      <main className="flex-grow flex min-h-0">
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
      </main>
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
        presets={presets}
        macros={starterMacros}
        onToggleTag={handleToggleTag}
        onLoadPreset={handleLoadPreset}
        onApplyMacro={handleApplyMacro}
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
        onClear={handleClear}
      />
       <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={aiSettings}
        onSave={setAiSettings}
        detectedProviders={detectedProviders}
        availableModels={availableModels}
        isDetecting={isDetecting}
        onRefresh={detectServicesAndFetchModels}
      />
      <DeconstructPromptModal
        isOpen={isDeconstructModalOpen}
        onClose={() => setIsDeconstructModalOpen(false)}
        onDeconstruct={handleDeconstructPrompt}
      />
    </div>
  );
};

export default App;