import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { starterTaxonomy } from './data/taxonomy';
import { starterPresets } from './data/presets';
import { starterMacros } from './data/macros';
import type { Tag, Category, SelectedTag, Preset, Conflict, UDIOParams, Macro } from './types';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { TagPicker } from './components/TagPicker';
import { PromptPreview } from './components/PromptPreview';

const taxonomyMap = new Map<string, Tag & { categoryId: string }>();
starterTaxonomy.forEach(cat => cat.tags.forEach(tag => taxonomyMap.set(tag.id, { ...tag, categoryId: cat.id })));

const initialCategoryOrder = starterTaxonomy.map(c => c.id);

const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [presets, setPresets] = useLocalStorage<Preset[]>('user-presets', starterPresets);
  const [categories, setCategories] = useState<Category[]>(starterTaxonomy);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(starterTaxonomy[0].id);
  const [selectedTags, setSelectedTags] = useState<Record<string, SelectedTag>>({});
  const [textCategoryValues, setTextCategoryValues] = useState<Record<string, string>>({});
  const [udioParams, setUDIOParams] = useState<UDIOParams>({ promptStrength: 94, remixDifference: 0.75 });

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
      const isCurrentlySelected = !!newSelected[tag.id];

      if (isCurrentlySelected) {
        // --- REMOVAL LOGIC ---
        const removedTag = newSelected[tag.id];
        delete newSelected[tag.id];

        if (removedTag?.implies) {
          removedTag.implies.forEach(impliedId => {
            const impliedTag = newSelected[impliedId];
            if (impliedTag && impliedTag.impliedBy) {
              const isStillImplied = Object.values(newSelected).some(
                t => t.implies?.includes(impliedId)
              );
              if (!isStillImplied) {
                delete newSelected[impliedId];
              }
            }
          });
        }

      } else {
        // --- ADDITION LOGIC ---
        const categoryId = taxonomyMap.get(tag.id)?.categoryId;
        if (categoryId) {
          newSelected[tag.id] = { ...tag, categoryId };

          tag.implies?.forEach(impliedId => {
              if (!newSelected[impliedId]) {
                 const impliedTag = taxonomyMap.get(impliedId);
                 if (impliedTag) {
                     newSelected[impliedId] = { 
                       ...impliedTag, 
                       impliedBy: tag.id,
                       implyingTagLabel: tag.label
                     };
                 }
              }
          });
        }
      }
      return newSelected;
    });
  }, []);
  
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
      
      const tagsToAddFromImplications: Record<string, SelectedTag> = {};
      Object.values(newSelectedTags).forEach(tag => {
          tag.implies?.forEach(impliedId => {
              if (!newSelectedTags[impliedId] && !tagsToAddFromImplications[impliedId]) {
                  const impliedTag = taxonomyMap.get(impliedId);
                  if (impliedTag) {
                      tagsToAddFromImplications[impliedId] = {
                          ...impliedTag,
                          impliedBy: tag.id,
                          implyingTagLabel: tag.label,
                      };
                  }
              }
          });
      });
      
      setSelectedTags({ ...newSelectedTags, ...tagsToAddFromImplications });
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

    const tagsToAddFromImplications: Record<string, SelectedTag> = {};
    Object.values(newSelectedTags).forEach(tag => {
        tag.implies?.forEach(impliedId => {
            if (!newSelectedTags[impliedId] && !tagsToAddFromImplications[impliedId]) {
                const impliedTag = taxonomyMap.get(impliedId);
                if (impliedTag) {
                    tagsToAddFromImplications[impliedId] = {
                        ...impliedTag,
                        impliedBy: tag.id,
                        implyingTagLabel: tag.label,
                    };
                }
            }
        });
    });

    setSelectedTags({ ...newSelectedTags, ...tagsToAddFromImplications });
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
          // Only save manually selected tags to presets
          if (!tag.impliedBy) {
            selectedTagsForPreset[id] = { categoryId: tag.categoryId };
          }
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

    const tagsToAddFromImplications: Record<string, SelectedTag> = {};
    Object.values(newSelected).forEach(tag => {
        tag.implies?.forEach(impliedId => {
            if (!newSelected[impliedId] && !tagsToAddFromImplications[impliedId]) {
                const impliedTag = taxonomyMap.get(impliedId);
                if (impliedTag) {
                    tagsToAddFromImplications[impliedId] = {
                        ...impliedTag,
                        impliedBy: tag.id,
                        implyingTagLabel: tag.label,
                    };
                }
            }
        });
    });

    setSelectedTags({ ...newSelected, ...tagsToAddFromImplications });
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

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-bunker-950 text-bunker-200">
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
      />
      <main className="flex-grow grid grid-cols-12 min-h-0">
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
            onToggleTag={handleToggleTag}
            textCategoryValues={textCategoryValues}
            onTextCategoryChange={handleTextCategoryChange}
          />
        </div>
        <div className="col-span-4 border-l border-bunker-800">
          <PromptPreview 
            orderedCategories={categories}
            selectedTags={selectedTags}
            textCategoryValues={textCategoryValues}
            conflicts={conflicts}
            udioParams={udioParams}
            onUDIOParamsChange={setUDIOParams}
          />
        </div>
      </main>
    </div>
  );
};

export default App;