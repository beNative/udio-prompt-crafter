import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterPresets } from './data/presets';
import { starterMacros } from './data/macros';
import type { Tag, Category, SelectedTag, Preset, Conflict, Macro, Taxonomy } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { CommandPalette } from './components/CommandPalette';
import { ResizablePanels } from './components/ResizablePanels';

interface ConflictState {
  newlySelectedTag: Tag;
  conflictingTag: Tag;
}

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [presets, setPresets] = useLocalStorage<Preset[]>('user-presets', starterPresets);
  const [panelSizes, setPanelSizes] = useLocalStorage('panel-sizes', [20, 45, 35]);
  
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    fetch('/taxonomy.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load taxonomy configuration file. Status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // The JSON file has a root "taxonomy" key
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
    taxonomy.forEach(cat => cat.tags.forEach(tag => newTaxonomyMap.set(tag.id, { ...tag, categoryId: cat.id })));
    const newAllTags = taxonomy.flatMap(c => c.tags);
    return { taxonomyMap: newTaxonomyMap, allTags: newAllTags, initialCategories: taxonomy };
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

  const loadTagsFromList = useCallback((tagIds: string[]) => {
      const newSelectedTags: Record<string, SelectedTag> = {};
      tagIds.forEach(tagId => {
          const fullTag = taxonomyMap.get(tagId);
          if (fullTag) {
              newSelectedTags[tagId] = { ...fullTag };
          }
      });
      setSelectedTags(newSelectedTags);
  }, [taxonomyMap]);


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
    </div>
  );
};

export default App;
