import React, { useState, useEffect, useMemo } from 'react';
import type { Taxonomy, Category, Tag } from '../types';
import { Icon } from './icons';
import { produce } from 'immer';
import { CategoryEditModal } from './CategoryEditModal';
import { TagEditModal } from './TagEditModal';

interface TaxonomyEditorProps {
  taxonomy: Taxonomy;
  onSave: (newTaxonomy: Taxonomy, reset?: boolean) => Promise<void>;
}

// A simple slugify function for creating IDs
const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');


export const TaxonomyEditor: React.FC<TaxonomyEditorProps> = ({ taxonomy, onSave }) => {
  const [editedTaxonomy, setEditedTaxonomy] = useState<Taxonomy>(() => JSON.parse(JSON.stringify(taxonomy)));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(taxonomy[0]?.id || null);
  const [isDirty, setIsDirty] = useState(false);
  const [modalState, setModalState] = useState<{ type: 'category' | 'tag', data: Category | Tag | null, isNew: boolean } | null>(null);

  useEffect(() => {
    // When the original taxonomy prop changes (e.g., after a reset), update the editor's state
    setEditedTaxonomy(JSON.parse(JSON.stringify(taxonomy)));
    setSelectedCategoryId(taxonomy[0]?.id || null);
    setIsDirty(false);
  }, [taxonomy]);

  const handleSaveChanges = async () => {
    if (window.confirm("Saving will reload the taxonomy and reset your current prompt. Are you sure you want to continue?")) {
      await onSave(editedTaxonomy);
      setIsDirty(false);
    }
  };

  const handleDiscardChanges = () => {
    setEditedTaxonomy(JSON.parse(JSON.stringify(taxonomy)));
    setIsDirty(false);
  };
  
  const handleResetToDefault = async () => {
    if (window.confirm("This will delete your custom taxonomy and restore the application default. This action cannot be undone. Are you sure?")) {
        await onSave(taxonomy, true); // onSave with reset flag
        setIsDirty(false);
    }
  };

  // Category Actions
  const handleAddCategory = () => {
      const newCategory: Category = { id: '', name: '', description: '', type: 'tags', tags: [] };
      setModalState({ type: 'category', data: newCategory, isNew: true });
  };
  
  const handleSaveCategory = (categoryToSave: Category) => {
    setEditedTaxonomy(produce(draft => {
        if (modalState?.isNew) {
            const newId = slugify(categoryToSave.name);
            if (draft.some(c => c.id === newId)) {
                alert(`Error: A category with ID '${newId}' already exists.`);
                return;
            }
            draft.push({ ...categoryToSave, id: newId });
            setSelectedCategoryId(newId);
        } else {
            const index = draft.findIndex(c => c.id === categoryToSave.id);
            if (index !== -1) {
                draft[index] = categoryToSave;
            }
        }
    }));
    setIsDirty(true);
    setModalState(null);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category and all its tags?")) {
        setEditedTaxonomy(produce(draft => draft.filter(c => c.id !== categoryId)));
        if(selectedCategoryId === categoryId) setSelectedCategoryId(editedTaxonomy[0]?.id || null);
        setIsDirty(true);
    }
  };

  // Tag Actions
  const handleAddTag = () => {
      if (!selectedCategoryId) return;
      const newTag: Tag = { id: '', label: '', description: '', color: 'gray' };
      setModalState({ type: 'tag', data: newTag, isNew: true });
  };

  const handleSaveTag = (tagToSave: Tag) => {
    if (!selectedCategoryId) return;

    setEditedTaxonomy(produce(draft => {
        const category = draft.find(c => c.id === selectedCategoryId);
        if (!category) return;
        
        if (modalState?.isNew) {
            const newId = `${slugify(category.id.split('_')[0])}_${slugify(tagToSave.label)}`;
            if (category.tags.some(t => t.id === newId)) {
                alert(`Error: A tag with ID '${newId}' already exists in this category.`);
                return;
            }
            category.tags.push({ ...tagToSave, id: newId });
        } else {
            const index = category.tags.findIndex(t => t.id === tagToSave.id);
            if (index !== -1) {
                category.tags[index] = tagToSave;
            }
        }
    }));
    setIsDirty(true);
    setModalState(null);
  };
  
  const handleDeleteTag = (tagId: string) => {
    if (!selectedCategoryId) return;
    if (window.confirm("Are you sure you want to delete this tag?")) {
        setEditedTaxonomy(produce(draft => {
            const category = draft.find(c => c.id === selectedCategoryId);
            if (category) {
                category.tags = category.tags.filter(t => t.id !== tagId);
                // Also remove it from any 'suggests' arrays in the same category
                category.tags.forEach(t => {
                    if (t.suggests?.includes(tagId)) {
                        t.suggests = t.suggests.filter(sId => sId !== tagId);
                    }
                });
            }
        }));
        setIsDirty(true);
    }
  };
  
  const allTagsFlat = useMemo(() => editedTaxonomy.flatMap(c => c.tags), [editedTaxonomy]);
  const selectedCategory = editedTaxonomy.find(c => c.id === selectedCategoryId);

  return (
    <div className="bg-white/50 dark:bg-bunker-900/50 backdrop-blur-sm rounded-xl border border-bunker-200/80 dark:border-bunker-800/80 shadow-sm">
        <div className="p-4 border-b border-bunker-200/80 dark:border-bunker-800/80 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-semibold">Taxonomy Editor</h3>
                <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-1">Your custom taxonomy is saved locally. Resetting will restore the application default.</p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={handleResetToDefault} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-3 py-1.5 bg-white dark:bg-bunker-800 text-xs font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">Reset to Default</button>
                <button onClick={handleDiscardChanges} disabled={!isDirty} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-3 py-1.5 bg-white dark:bg-bunker-800 text-xs font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors disabled:opacity-50">Discard Changes</button>
                <button onClick={handleSaveChanges} disabled={!isDirty} className="rounded-md border border-transparent px-3 py-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">Save Taxonomy</button>
            </div>
        </div>
        <div className="p-4 flex space-x-4 min-h-[400px]">
            {/* Category List */}
            <div className="w-1/3 border-r border-bunker-200/80 dark:border-bunker-800/80 pr-4">
                <h4 className="font-semibold mb-2">Categories</h4>
                <div className="space-y-1">
                    {editedTaxonomy.map(cat => (
                        <div key={cat.id} 
                             onClick={() => setSelectedCategoryId(cat.id)}
                             className={`group flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800'}`}>
                            <span>{cat.name}</span>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'category', data: cat, isNew: false }); }} className="p-1 hover:bg-white/20 rounded"><Icon name="pencil" className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 hover:bg-white/20 rounded"><Icon name="trash" className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={handleAddCategory} className="mt-4 w-full flex items-center justify-center space-x-2 text-sm px-3 py-1.5 rounded-md bg-bunker-100 hover:bg-bunker-200 dark:bg-bunker-800 dark:hover:bg-bunker-700 transition-colors">
                    <Icon name="plus" className="w-4 h-4" />
                    <span>Add Category</span>
                </button>
            </div>
            {/* Tag List */}
            <div className="w-2/3 flex flex-col">
                {selectedCategory ? (
                    <div className="flex flex-col flex-grow min-h-0">
                         <div className="flex-shrink-0 flex justify-between items-center mb-2">
                             <h4 className="font-semibold">Tags in "{selectedCategory.name}"</h4>
                             <button onClick={handleAddTag} className="flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md bg-bunker-100 hover:bg-bunker-200 dark:bg-bunker-800 dark:hover:bg-bunker-700 transition-colors">
                                <Icon name="plus" className="w-4 h-4" />
                                <span>Add Tag</span>
                            </button>
                         </div>
                        <div className="flex-grow space-y-1 p-2 border border-bunker-200 dark:border-bunker-700 rounded-md bg-bunker-50 dark:bg-bunker-950/50 overflow-y-auto">
                            {selectedCategory.tags.map(tag => (
                                <div key={tag.id} className="group flex justify-between items-center p-2 rounded-md hover:bg-bunker-100 dark:hover:bg-bunker-800">
                                    <span>{tag.label}</span>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setModalState({ type: 'tag', data: tag, isNew: false })} className="p-1 hover:bg-bunker-200 dark:hover:bg-bunker-700 rounded"><Icon name="pencil" className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteTag(tag.id)} className="p-1 hover:bg-bunker-200 dark:hover:bg-bunker-700 rounded"><Icon name="trash" className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                             {selectedCategory.tags.length === 0 && <p className="text-center text-sm text-bunker-400 py-4">No tags in this category.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-bunker-400">Select a category to view its tags.</div>
                )}
            </div>
        </div>

        {modalState?.type === 'category' && (
            <CategoryEditModal 
                isOpen={true}
                onClose={() => setModalState(null)}
                onSave={handleSaveCategory}
                category={modalState.data as Category}
            />
        )}
         {modalState?.type === 'tag' && (
            <TagEditModal
                isOpen={true}
                onClose={() => setModalState(null)}
                onSave={handleSaveTag}
                tag={modalState.data as Tag}
                allTags={allTagsFlat}
            />
        )}
    </div>
  );
};