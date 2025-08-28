import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterTaxonomy } from './data/taxonomy';
import { starterPresets } from './data/presets';
import { starterMacros } from './data/macros';
import type { Tag, Category, SelectedTag, Preset, Conflict, Macro } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { CommandPalette } from './components/CommandPalette';

const taxonomyMap = new Map<string, Tag & { categoryId: string }>();
starterTaxonomy.forEach(cat => cat.tags.forEach(tag => taxonomyMap.set(tag.id, { ...tag, categoryId: cat.id })));

const initialCategoryOrder = starterTaxonomy.map(c => c.id);

interface ConflictState {
  newlySelectedTag: Tag;
  conflictingTag: Tag;
}

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [presets, setPresets] = useLocalStorage<Preset[]>('user-presets', starterPresets);
  const [categories, setCategories] = useState<Category[]>(starterTaxonomy);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(starterTaxonomy[0].id);
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);


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
  }, [selectedTags]);

  const handleResolveConflict = (keepNew: boolean) => {
    if (!conflictState) return;

    if (keepNew) {
      const { newlySelectedTag, conflictingTag } = conflictState;
      setSelectedTags(prev => {
        const newSelected = { ...prev };
        // Remove conflicting tag
        delete newSelected[conflictingTag.id];

        // Add new tag
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

  const loadTagsFromList = (tagIds: string[]) => {
      const newSelectedTags: Record<string, SelectedTag> = {};
      tagIds.forEach(tagId => {
          const fullTag = taxonomyMap.get(tagId);
          if (fullTag) {
              newSelectedTags[tagId] = { ...fullTag };
          }
      });
      setSelectedTags(newSelectedTags);
  };

  const handleApplyMacro = (macro: Macro) => {
    loadTagsFromList(macro.tags);
    setTextCategoryValues({});
  };

  const handleLoadPreset = (preset: Preset) => {
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
        const ordered = preset.categoryOrder.map(id => presetCategoryMap.get(id)).filter(Boolean) as Category[];
        const remaining = prevCategories.filter(c => !preset.categoryOrder.includes(c.id));
        return [...ordered, ...remaining];
    });
  };

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
  
  const handleRandomize = () => {
    const newSelected: Record<string, SelectedTag> = {};
    categories.forEach(category => {
        if(category.tags.length > 0 && category.type !== 'text') {
            const randomTag = category.tags[Math.floor(Math.random() * category.tags.length)];
            newSelected[randomTag.id] = { ...randomTag, categoryId: category.id };
        }
    });
    setSelectedTags(newSelected);
    setTextCategoryValues({});
  };

  const handleClear = () => {
    setSelectedTags({});
    setTextCategoryValues({});
  };
  
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

  const allTags = useMemo(() => starterTaxonomy.flatMap(c => c.tags), []);

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
      <main className="flex-grow grid grid-cols-12 min-h-0">
        <div className="col-span-3 border-r border-bunker-200 dark:border-bunker-800">
          <CategoryList
            categories={categories}
            activeCategoryId={activeCategoryId}
            selectedTagCounts={selectedTagCounts}
            onSelectCategory={setActiveCategoryId}
            onCategoryOrderChange={handleCategoryOrderChange}
          />
        </div>
        <div className="col-span-5 overflow-y-auto">
          <TagPicker
            category={activeCategory}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            textCategoryValues={textCategoryValues}
            onTextCategoryChange={handleTextCategoryChange}
            taxonomyMap={taxonomyMap}
          />
        </div>
        <div className="col-span-4 border-l border-bunker-200 dark:border-bunker-800">
          <PromptPreview 
            orderedCategories={categories}
            selectedTags={selectedTags}
            textCategoryValues={textCategoryValues}
            conflicts={conflicts}
          />
        </div>
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