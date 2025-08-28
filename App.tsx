
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterTaxonomy } from './data/taxonomy';
import { starterPresets } from './data/presets';
import type { Tag, Category, SelectedTag, Preset, Conflict } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';

// Helper to create a map for faster lookups
// FIX: The taxonomyMap now stores tags with their categoryId to prevent type errors when creating SelectedTag for implied tags.
const taxonomyMap = new Map<string, Tag & { categoryId: string }>();
starterTaxonomy.forEach(cat => cat.tags.forEach(tag => taxonomyMap.set(tag.id, { ...tag, categoryId: cat.id })));


const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [presets, setPresets] = useLocalStorage<Preset[]>('user-presets', starterPresets);
  const [categories, setCategories] = useState<Category[]>(starterTaxonomy);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(starterTaxonomy[0].id);
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleCategoryOrderChange = (newCategories: Category[]) => {
    setCategories(newCategories);
  };
  
  const handleToggleTag = useCallback((tag: Tag) => {
    setSelectedTags(prev => {
      const newSelected = { ...prev };
      if (newSelected[tag.id]) {
        delete newSelected[tag.id];
      } else {
        const categoryId = starterTaxonomy.find(c => c.tags.some(t => t.id === tag.id))?.id;
        if (categoryId) {
          newSelected[tag.id] = { ...tag, categoryId, weight: tag.default_weight || 1 };

          // Handle implications
          tag.implies?.forEach(impliedId => {
              if (!newSelected[impliedId]) {
                 const impliedTag = taxonomyMap.get(impliedId);
                 if (impliedTag) {
                     newSelected[impliedId] = { ...impliedTag, weight: impliedTag.default_weight || 1 };
                 }
              }
          });
        }
      }
      return newSelected;
    });
  }, []);

  const handleWeightChange = (tagId: string, weight: number) => {
    setSelectedTags(prev => ({
      ...prev,
      [tagId]: { ...prev[tagId], weight },
    }));
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
          selectedTagsForPreset[id] = { categoryId: tag.categoryId, weight: tag.weight };
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
        if(category.tags.length > 0) {
            const randomTag = category.tags[Math.floor(Math.random() * category.tags.length)];
            newSelected[randomTag.id] = { ...randomTag, categoryId: category.id, weight: 1.0 };
        }
    });
    setSelectedTags(newSelected);
  };

  const handleClear = () => {
    setSelectedTags({});
  };
  
  const activeCategory = useMemo(() => categories.find(c => c.id === activeCategoryId), [categories, activeCategoryId]);

  const selectedTagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(selectedTags).forEach(tag => {
      counts[tag.categoryId] = (counts[tag.categoryId] || 0) + 1;
    });
    return counts;
  }, [selectedTags]);

  const { conflicts, suggestedTagIds } = useMemo(() => {
    const newConflicts: Conflict[] = [];
    const newSuggestions = new Set<string>();
    const selectedList = Object.values(selectedTags);

    for (const tagA of selectedList) {
        // Check for conflicts
        if (tagA.conflictsWith) {
            for (const conflictId of tagA.conflictsWith) {
                if (selectedTags[conflictId]) {
                    const tagB = selectedTags[conflictId];
                    // Avoid duplicate warnings (A->B and B->A)
                    if (tagA.id < tagB.id) {
                         newConflicts.push({ tagA, tagB });
                    }
                }
            }
        }
        // Check for implications (suggestions)
        if (tagA.implies) {
            for (const impliedId of tagA.implies) {
                if (!selectedTags[impliedId]) {
                    newSuggestions.add(impliedId);
                }
            }
        }
    }
    return { conflicts: newConflicts, suggestedTagIds: newSuggestions };
  }, [selectedTags]);

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-bunker-950 text-bunker-200">
      <Header 
        theme={theme} 
        presets={presets}
        onToggleTheme={toggleTheme}
        onLoadPreset={handleLoadPreset}
        onSavePreset={handleSavePreset}
        onRandomize={handleRandomize}
        onClear={handleClear}
      />
      <main className="flex-grow grid grid-cols-12" style={{height: 'calc(100vh - 60px)'}}>
        <div className="col-span-3 border-r border-bunker-800">
          <CategoryList
            categories={categories}
            activeCategoryId={activeCategoryId}
            selectedTagCounts={selectedTagCounts}
            onSelectCategory={setActiveCategoryId}
            onCategoryOrderChange={handleCategoryOrderChange}
          />
        </div>
        <div className="col-span-5">
          <TagPicker
            category={activeCategory}
            selectedTags={selectedTags}
            suggestedTagIds={suggestedTagIds}
            onToggleTag={handleToggleTag}
            onWeightChange={handleWeightChange}
          />
        </div>
        <div className="col-span-4 border-l border-bunker-800">
          <PromptPreview 
            orderedCategories={categories}
            selectedTags={selectedTags}
            conflicts={conflicts}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
