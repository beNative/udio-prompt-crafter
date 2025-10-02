import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Taxonomy, Category, Tag } from '../types';
import { Icon } from './icons';
import { produce } from 'immer';
import { CategoryEditModal } from './CategoryEditModal';
import { TagEditor } from './TagEditor';
import { ConfirmationModal } from './ConfirmationModal';
import { useListKeyboardNavigation } from '../hooks/useListKeyboardNavigation';

interface TaxonomyEditorProps {
  taxonomy: Taxonomy;
  onSave: (newTaxonomy: Taxonomy, reset?: boolean) => Promise<void>;
}

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

const colorClasses: Record<NonNullable<Tag['color']>, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500',
  gray: 'bg-bunker-500',
};

// --- Tree View Components ---

interface TreeNode extends Tag {
  children: TreeNode[];
}

interface TagNodeProps {
  node: TreeNode;
  level: number;
  onDragStart: (e: React.DragEvent, tagId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, tagId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tagId: string) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (tagId: string) => void;
  draggedTagId: string | null;
  dropTarget: { id: string; position: 'top' | 'bottom' | 'on' } | null;
}

const TagNode: React.FC<TagNodeProps> = ({
  node, level, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onEdit, onDelete,
  draggedTagId, dropTarget
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const isBeingDragged = draggedTagId === node.id;
  const isDropTarget = dropTarget?.id === node.id;

  const dropIndicatorStyle = () => {
    if (!isDropTarget) return {};
    switch (dropTarget.position) {
      case 'top': return { boxShadow: 'inset 0 2px 0 0 #2563eb' };
      case 'bottom': return { boxShadow: 'inset 0 -2px 0 0 #2563eb' };
      case 'on': return { backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px dashed #2563eb' };
      default: return {};
    }
  };

  return (
    <div className="flex flex-col">
      <div
        style={{ ...dropIndicatorStyle(), paddingLeft: `${level * 1.5}rem` }}
        className={`group flex items-center p-1 rounded-md transition-all ${isBeingDragged ? 'opacity-30' : ''}`}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.id)}
      >
        <div
          draggable
          onDragStart={(e) => onDragStart(e, node.id)}
          onDragEnd={onDragEnd}
          className="flex items-center space-x-2 flex-grow min-w-0"
        >
          <Icon name="grip" className="w-5 h-5 text-bunker-400 dark:text-bunker-500 cursor-grab" />
          {node.children.length > 0 ? (
            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <Icon name="chevronRight" className={`w-4 h-4 text-bunker-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClasses[node.color || 'gray']}`} />
          <span className="truncate">{node.label}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(node)} className="p-1 hover:bg-bunker-200 dark:hover:bg-bunker-700 rounded"><Icon name="pencil" className="w-4 h-4" /></button>
          <button onClick={() => onDelete(node.id)} className="p-1 hover:bg-bunker-200 dark:hover:bg-bunker-700 rounded"><Icon name="trash" className="w-4 h-4" /></button>
        </div>
      </div>
      {isOpen && node.children.length > 0 && (
        <TagTreeView
          nodes={node.children}
          level={level + 1}
          {...{ onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onEdit, onDelete, draggedTagId, dropTarget }}
        />
      )}
    </div>
  );
};

interface TagTreeViewProps extends Omit<TagNodeProps, 'node' | 'level'> {
  nodes: TreeNode[];
  level?: number;
}

const TagTreeView: React.FC<TagTreeViewProps> = ({ nodes, level = 0, ...props }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => <TagNode key={node.id} node={node} level={level} {...props} />)}
    </div>
  );
};


// --- Main Editor Component ---
export const TaxonomyEditor: React.FC<TaxonomyEditorProps> = ({ taxonomy, onSave }) => {
  const [editedTaxonomy, setEditedTaxonomy] = useState<Taxonomy>(() => JSON.parse(JSON.stringify(taxonomy)));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(taxonomy[0]?.id || null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; variant: 'primary' | 'danger', confirmText: string } | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  // Drag state for categories
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  // Drag state for tags
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'top' | 'bottom' | 'on' } | null>(null);

  const { listProps: categoryListProps, getItemProps: getCategoryItemProps } = useListKeyboardNavigation({
    items: editedTaxonomy,
    getId: category => category.id,
    activeId: selectedCategoryId,
    onSelect: (category) => {
      setSelectedCategoryId(category.id);
      setEditingTag(null);
    },
  });

  const categoryFocusRingClasses = 'focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus:ring-0';

  useEffect(() => {
    setEditedTaxonomy(JSON.parse(JSON.stringify(taxonomy)));
    setSelectedCategoryId(taxonomy[0]?.id || null);
    setIsDirty(false);
  }, [taxonomy]);
  
  const handleSaveChanges = () => {
    setConfirmation({
        title: "Save Taxonomy?",
        message: "Saving will reload the taxonomy and reset your current prompt. Are you sure you want to continue?",
        variant: 'primary',
        confirmText: "Save",
        onConfirm: async () => {
            await onSave(editedTaxonomy);
            setIsDirty(false);
        }
    });
  };

  const handleDiscardChanges = () => {
    setEditedTaxonomy(JSON.parse(JSON.stringify(taxonomy)));
    setIsDirty(false);
  };
  
  const handleResetToDefault = () => {
    setConfirmation({
        title: "Reset to Default?",
        message: "This will delete your custom taxonomy and restore the application default. This action cannot be undone. Are you sure?",
        variant: 'danger',
        confirmText: "Reset",
        onConfirm: async () => {
            await onSave(taxonomy, true);
        }
    });
  };

  // --- Category Actions ---
  const handleDropCategory = (targetId: string) => {
    if (!draggedCategory || draggedCategory === targetId) return;
    setEditedTaxonomy(produce(draft => {
      const draggedIndex = draft.findIndex(c => c.id === draggedCategory);
      const targetIndex = draft.findIndex(c => c.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return;
      const [removed] = draft.splice(draggedIndex, 1);
      draft.splice(targetIndex, 0, removed);
    }));
    setIsDirty(true);
    setDraggedCategory(null);
  };
  
  const handleAddCategory = () => {
    setCategoryToEdit({ id: '', name: '', description: '', type: 'tags', tags: [] });
    setIsCategoryModalOpen(true);
  }

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setIsCategoryModalOpen(true);
  }
  
  const handleSaveCategory = (categoryToSave: Category) => {
    setEditedTaxonomy(produce(draft => {
      if (!categoryToSave.id) { // isNew
        const newId = slugify(categoryToSave.name);
        if (draft.some(c => c.id === newId)) { alert(`Error: A category with ID '${newId}' already exists.`); return; }
        draft.push({ ...categoryToSave, id: newId });
        setSelectedCategoryId(newId);
      } else {
        const index = draft.findIndex(c => c.id === categoryToSave.id);
        if (index !== -1) draft[index] = categoryToSave;
      }
    }));
    setIsDirty(true);
    setIsCategoryModalOpen(false);
    setCategoryToEdit(null);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setConfirmation({
        title: "Delete Category?",
        message: <span>Are you sure you want to delete the category <strong>"{editedTaxonomy.find(c=>c.id === categoryId)?.name}"</strong> and all its tags? This action cannot be undone.</span>,
        variant: 'danger',
        confirmText: "Delete",
        onConfirm: () => {
            setEditedTaxonomy(produce(draft => draft.filter(c => c.id !== categoryId)));
            if(selectedCategoryId === categoryId) setSelectedCategoryId(editedTaxonomy[0]?.id || null);
            setIsDirty(true);
        }
    });
  };

  // --- Tag Actions ---
  const handleAddTag = () => {
    if (!selectedCategoryId) return;
    setEditingTag({ id: '', label: '', description: '', color: 'gray' });
  };

  const handleSaveTag = (tagToSave: Tag, originalId: string) => {
    if (!selectedCategoryId && !originalId) return;

    setEditedTaxonomy(produce(draft => {
      const allTagsInDraft = draft.flatMap(c => c.tags);
      const isNewTag = !originalId;

      if (isNewTag) {
        const category = draft.find(c => c.id === selectedCategoryId);
        if (!category) return;
        
        let newId = tagToSave.id.trim();
        if (!newId) {
            newId = `${slugify(category.id.split('_')[0])}_${slugify(tagToSave.label)}`;
        }

        if (allTagsInDraft.some(t => t.id === newId)) {
          alert(`Error: A tag with ID '${newId}' already exists.`);
          return;
        }
        category.tags.push({ ...tagToSave, id: newId });
      } else {
        const newId = tagToSave.id;

        if (originalId !== newId && allTagsInDraft.some(t => t.id === newId)) {
          alert(`Error: A tag with the ID '${newId}' already exists.`);
          return;
        }
        
        if (originalId !== newId) {
          allTagsInDraft.forEach(tag => {
            if (tag.suggests?.includes(originalId)) tag.suggests = tag.suggests.map(id => id === originalId ? newId : id);
            if (tag.conflictsWith?.includes(originalId)) tag.conflictsWith = tag.conflictsWith.map(id => id === originalId ? newId : id);
          });
        }
        
        const category = draft.find(c => c.tags.some(t => t.id === originalId));
        if (category) {
            const tagIndex = category.tags.findIndex(t => t.id === originalId);
            if (tagIndex !== -1) category.tags[tagIndex] = tagToSave;
        }
      }
    }));

    setIsDirty(true);
    setEditingTag(null);
  };
  
  const handleDeleteTag = (tagId: string) => {
    if (!selectedCategoryId) return;
    const tagLabel = editedTaxonomy.flatMap(c => c.tags).find(t => t.id === tagId)?.label;
    setConfirmation({
        title: "Delete Tag?",
        message: <span>Are you sure you want to delete the tag <strong>"{tagLabel}"</strong>? This will also remove any relationships pointing to it.</span>,
        variant: 'danger',
        confirmText: "Delete",
        onConfirm: () => {
            setEditedTaxonomy(produce(draft => {
                draft.forEach(category => {
                    category.tags = category.tags.filter(t => t.id !== tagId);
                    category.tags.forEach(t => { 
                        if (t.suggests?.includes(tagId)) t.suggests = t.suggests.filter(sId => sId !== tagId);
                        if (t.conflictsWith?.includes(tagId)) t.conflictsWith = t.conflictsWith.filter(cId => cId !== tagId);
                    });
                });
            }));
            setIsDirty(true);
        }
    });
  };

  // --- Tag Drag & Drop Handlers ---
  const handleTagDragStart = (e: React.DragEvent, tagId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTagId(tagId);
  };
  const handleTagDragEnd = () => setDraggedTagId(null);
  const handleTagDragLeave = () => setDropTarget(null);

  const handleTagDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTagId) return;

    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'top' | 'bottom' | 'on' = 'on';
    if (y < height * 0.25) position = 'top';
    else if (y > height * 0.75) position = 'bottom';
    
    setDropTarget({ id: targetId, position });
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTagId || !selectedCategoryId) return;
    
    setEditedTaxonomy(produce(draft => {
        const category = draft.find(c => c.id === selectedCategoryId);
        if (!category?.tags) return;
        const draggedIndex = category.tags.findIndex(t => t.id === draggedTagId);
        if (draggedIndex === -1) return;
        
        const [draggedTag] = category.tags.splice(draggedIndex, 1);
        
        const oldParentId = draggedTag.suggests?.find(id => category.tags.some(t => t.id === id));
        if (oldParentId) draggedTag.suggests = draggedTag.suggests.filter(id => id !== oldParentId);
        
        category.tags.unshift(draggedTag);
    }));
    setIsDirty(true);
    setDraggedTagId(null);
    setDropTarget(null);
  }

  const handleTagDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTagId || !dropTarget || draggedTagId === targetId) {
        setDraggedTagId(null);
        setDropTarget(null);
        return;
    }

    setEditedTaxonomy(produce(draft => {
      const category = draft.find(c => c.id === selectedCategoryId);
      if (!category?.tags) return;
      
      const draggedIndex = category.tags.findIndex(t => t.id === draggedTagId);
      if (draggedIndex === -1) return;
      const [draggedTag] = category.tags.splice(draggedIndex, 1);

      const oldParentId = draggedTag.suggests?.find(id => category.tags.some(t => t.id === id));
      if (oldParentId) draggedTag.suggests = draggedTag.suggests.filter(id => id !== oldParentId);

      const targetIndex = category.tags.findIndex(t => t.id === targetId);
      if (targetIndex === -1) { category.tags.splice(draggedIndex, 0, draggedTag); return; }

      if (dropTarget.position === 'on') {
        if (!draggedTag.suggests) draggedTag.suggests = [];
        if (!draggedTag.suggests.includes(targetId)) draggedTag.suggests.unshift(targetId);
        category.tags.splice(targetIndex + 1, 0, draggedTag);
      } else {
        const targetTag = category.tags[targetIndex];
        const newParentId = targetTag.suggests?.find(id => category.tags.some(t => t.id === id)) || null;
        if (newParentId) {
            if (!draggedTag.suggests) draggedTag.suggests = [];
            if (!draggedTag.suggests.includes(newParentId)) draggedTag.suggests.unshift(newParentId);
        }
        const insertionIndex = dropTarget.position === 'top' ? targetIndex : targetIndex + 1;
        category.tags.splice(insertionIndex, 0, draggedTag);
      }
    }));

    setIsDirty(true);
    setDraggedTagId(null);
    setDropTarget(null);
  };
  
  const allTagsFlat = useMemo(() => editedTaxonomy.flatMap(c => c.tags), [editedTaxonomy]);
  const selectedCategory = editedTaxonomy.find(c => c.id === selectedCategoryId);
  
  const tagTree = useMemo((): TreeNode[] => {
    if (!selectedCategory || !selectedCategory.tags) return [];
    
    const tags = selectedCategory.tags;
    const nodes: { [id: string]: TreeNode } = {};
    tags.forEach(tag => { nodes[tag.id] = { ...tag, children: [] }; });

    const tree: TreeNode[] = [];
    tags.forEach(tag => {
      const node = nodes[tag.id];
      const parentId = node.suggests?.find(id => nodes[id]);
      if (parentId && nodes[parentId]) {
        nodes[parentId].children.push(node);
      } else {
        tree.push(node);
      }
    });
    return tree;
  }, [selectedCategory]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-bunker-200/80 dark:border-bunker-800/80 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-lg font-semibold">Taxonomy Editor</h3>
          <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-1">Drag and drop to reorder. Your custom taxonomy is saved locally.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleResetToDefault} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-3 py-1.5 bg-white dark:bg-bunker-800 text-xs font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">Reset to Default</button>
          <button onClick={handleDiscardChanges} disabled={!isDirty} className="rounded-md border border-bunker-300 dark:border-bunker-600 px-3 py-1.5 bg-white dark:bg-bunker-800 text-xs font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors disabled:opacity-50">Discard Changes</button>
          <button onClick={handleSaveChanges} disabled={!isDirty} className="rounded-md border border-transparent px-3 py-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">Save Taxonomy</button>
        </div>
      </div>
      <div className="p-4 flex space-x-4 flex-grow min-h-0">
        <div className="w-1/3 flex flex-col">
          <h4 className="font-semibold mb-2 px-2 flex-shrink-0">Categories</h4>
          <ul {...categoryListProps} className="flex-grow space-y-1 pr-2 overflow-y-auto">
            {editedTaxonomy.map((cat, index) => (
              <li
                key={cat.id}
                draggable
                {...getCategoryItemProps(cat, index)}
                onDragStart={() => setDraggedCategory(cat.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropCategory(cat.id)}
                onDragEnd={() => setDraggedCategory(null)}
                className={`group flex justify-between items-center p-2 rounded-md cursor-pointer transition-all ${selectedCategoryId === cat.id ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800'} ${draggedCategory === cat.id ? 'opacity-30' : ''} ${categoryFocusRingClasses}`}
              >
                <div className="flex items-center">
                  <Icon name="grip" className="w-5 h-5 mr-2 text-bunker-400 dark:text-bunker-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <span>{cat.name}</span>
                </div>
                <div className={`flex items-center space-x-1 transition-opacity ${selectedCategoryId === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }} className="p-1 hover:bg-white/20 rounded"><Icon name="pencil" className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 hover:bg-white/20 rounded"><Icon name="trash" className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={handleAddCategory} className="mt-4 w-full flex-shrink-0 flex items-center justify-center space-x-2 text-sm px-3 py-1.5 rounded-md bg-bunker-100 hover:bg-bunker-200 dark:bg-bunker-800 dark:hover:bg-bunker-700 transition-colors"><Icon name="plus" className="w-4 h-4" /><span>Add Category</span></button>
        </div>
        <div className="w-2/3 flex flex-col border-l border-bunker-200/80 dark:border-bunker-800/80 pl-4">
          {selectedCategory ? (
              editingTag ? (
                <TagEditor 
                    tag={editingTag} 
                    allTags={allTagsFlat} 
                    onSave={handleSaveTag} 
                    onCancel={() => setEditingTag(null)} 
                />
              ) : (
                <>
                  <div className="flex-shrink-0 flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Tags in "{selectedCategory.name}"</h4>
                    <button onClick={handleAddTag} disabled={selectedCategory.type !== 'tags' && !!selectedCategory.type} className="flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md bg-bunker-100 hover:bg-bunker-200 dark:bg-bunker-800 dark:hover:bg-bunker-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="plus" className="w-4 h-4" /><span>Add Tag</span></button>
                  </div>
                  {(!selectedCategory.type || selectedCategory.type === 'tags') ? (
                    <div className="flex-grow p-1 pr-2 border border-bunker-200 dark:border-bunker-700 rounded-md bg-bunker-50 dark:bg-bunker-950/50 overflow-y-auto">
                        <div className="h-4" onDragOver={e => e.preventDefault()} onDrop={handleRootDrop} />
                        <TagTreeView
                            nodes={tagTree}
                            onDragStart={handleTagDragStart}
                            onDragEnd={handleTagDragEnd}
                            onDragOver={handleTagDragOver}
                            onDragLeave={handleTagDragLeave}
                            onDrop={handleTagDrop}
                            onEdit={setEditingTag}
                            onDelete={handleDeleteTag}
                            draggedTagId={draggedTagId}
                            dropTarget={dropTarget}
                        />
                        {selectedCategory.tags.length === 0 && <p className="text-center text-sm text-bunker-400 py-4">No tags in this category.</p>}
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-center p-4 border border-bunker-200 dark:border-bunker-700 rounded-md bg-bunker-50 dark:bg-bunker-950/50 text-bunker-500 text-sm">This category is of type '{selectedCategory.type}' and does not contain tags.</div>
                  )}
                </>
              )
          ) : (
            <div className="flex items-center justify-center h-full text-bunker-400">Select a category to view its tags.</div>
          )}
        </div>
      </div>
      {isCategoryModalOpen && categoryToEdit && <CategoryEditModal isOpen={true} onClose={() => setIsCategoryModalOpen(false)} onSave={handleSaveCategory} category={categoryToEdit} />}
      {confirmation && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmation(null)}
            onConfirm={confirmation.onConfirm}
            title={confirmation.title}
            message={confirmation.message}
            confirmVariant={confirmation.variant}
            confirmText={confirmation.confirmText}
        />
      )}
    </div>
  );
};
