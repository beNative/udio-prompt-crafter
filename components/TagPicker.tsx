import React, { useState, useMemo } from 'react';
import type { Category, Tag, SelectedTag } from '../types';
import { TagChip } from './TagChip';
import { TagTreeView, TreeNodeData } from './TagTreeView';
import { Icon } from './icons';

interface TagPickerProps {
  category: Category | undefined;
  selectedTags: Record<string, SelectedTag>;
  onToggleTag: (tag: Tag) => void;
  textCategoryValues: Record<string, string>;
  onTextCategoryChange: (categoryId: string, value: string) => void;
  onClearCategoryTags: (categoryId: string) => void;
  taxonomyMap: Map<string, Tag & { categoryId: string }>;
}

export const TagPicker: React.FC<TagPickerProps> = ({ 
    category, 
    selectedTags, 
    onToggleTag, 
    textCategoryValues,
    onTextCategoryChange,
    onClearCategoryTags,
    taxonomyMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = useMemo(() => {
    if (!category || category.type === 'text' || !searchTerm) return [];
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return category.tags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(lowerCaseSearch) ||
        tag.synonyms?.some((s) => s.toLowerCase().includes(lowerCaseSearch))
    );
  }, [category, searchTerm]);

  const hasSelectedTagsInCategory = useMemo(() => {
    if (!category || category.type === 'text') return false;
    return Object.values(selectedTags).some(tag => tag.categoryId === category.id);
  }, [selectedTags, category]);

  const tagTree = useMemo((): TreeNodeData[] => {
    if (!category || category.type === 'text' || !category.tags) return [];
    
    const tags = category.tags;
    const nodeMap: Map<string, TreeNodeData> = new Map();
    tags.forEach(tag => {
        nodeMap.set(tag.id, { ...tag, children: [] });
    });

    const roots: TreeNodeData[] = [];
    tags.forEach(tag => {
        const node = nodeMap.get(tag.id)!;
        const parentId = tag.suggests?.find(id => nodeMap.has(id));
        
        if (parentId) {
            const parentNode = nodeMap.get(parentId);
            parentNode?.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
  }, [category]);
  
  const suggestions = useMemo(() => {
    if (!category || category.type === 'text') return [];

    const selectedInCategory = Object.values(selectedTags).filter(t => t.categoryId === category.id);
    
    const suggestedIds = new Set<string>();
    selectedInCategory.forEach(tag => {
        tag.suggests?.forEach(id => {
            if (!selectedTags[id]) { // don't suggest already selected tags
                suggestedIds.add(id);
            }
        });
    });
    
    // FIX: A type predicate's type must be assignable to its parameter's type.
    // `Tag` is not assignable to `Tag & { categoryId: string; }`.
    // Changed to `SelectedTag` which correctly includes `categoryId`.
    return Array.from(suggestedIds).map(id => taxonomyMap.get(id)).filter((t): t is SelectedTag => !!t);
  }, [category, selectedTags, taxonomyMap]);


  if (!category) {
    return (
      <div className="flex items-center justify-center h-full text-bunker-400 dark:text-bunker-500">
        <p>Select a category to begin</p>
      </div>
    );
  }

  if (category.type === 'text') {
    return (
        <div className="p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-bunker-900 dark:text-white">{category.name}</h2>
            {category.description && <p className="text-bunker-500 dark:text-bunker-400 mb-4 text-sm">{category.description}</p>}
            <textarea
                value={textCategoryValues[category.id] || ''}
                onChange={e => onTextCategoryChange(category.id, e.target.value)}
                className="w-full h-96 p-3 bg-bunker-100 dark:bg-bunker-900 border border-bunker-300 dark:border-bunker-700 rounded-md text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={`Enter ${category.name.toLowerCase()} here...`}
            />
        </div>
    )
  }

  return (
    <div className="p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-bunker-900 dark:text-white">{category.name}</h2>
        {hasSelectedTagsInCategory && (
          <button
            onClick={() => onClearCategoryTags(category.id)}
            className="flex items-center space-x-2 text-sm px-3 py-1 rounded-md bg-bunker-100 hover:bg-red-100 hover:text-red-600 dark:bg-bunker-800 dark:text-bunker-400 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors"
            title={`Clear all selected tags in ${category.name}`}
          >
            <Icon name="x" className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
      <input
        type="text"
        placeholder={`Search in ${category.name}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-6 bg-bunker-100 dark:bg-bunker-900 border border-bunker-300 dark:border-bunker-700 rounded-md text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="pr-2">
        {searchTerm ? (
          <div className="flex flex-wrap gap-3">
            {filteredTags.map((tag) => {
                const isSelected = !!selectedTags[tag.id];
                return (
                <TagChip
                    key={tag.id}
                    tag={tag}
                    isSelected={isSelected}
                    onToggle={onToggleTag}
                />
                );
            })}
          </div>
        ) : (
            <TagTreeView
                nodes={tagTree}
                selectedTags={selectedTags}
                onToggleTag={onToggleTag}
            />
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="mt-8 pt-4 border-t border-bunker-200 dark:border-bunker-700">
            <h3 className="text-base font-semibold mb-4 text-bunker-600 dark:text-bunker-300">Suggestions</h3>
            <div className="flex flex-wrap gap-3">
            {suggestions.map((tag) => (
                <TagChip
                key={tag.id}
                tag={tag}
                isSelected={!!selectedTags[tag.id]}
                onToggle={onToggleTag}
                />
            ))}
            </div>
        </div>
      )}
    </div>
  );
};
