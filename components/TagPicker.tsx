
import React, { useState, useMemo } from 'react';
import type { Category, Tag, SelectedTag } from '../types';
import { TagChip } from './TagChip';

interface TagPickerProps {
  category: Category | undefined;
  selectedTags: Record<string, SelectedTag>;
  suggestedTagIds: Set<string>;
  onToggleTag: (tag: Tag) => void;
  onWeightChange: (tagId: string, weight: number) => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({ category, selectedTags, suggestedTagIds, onToggleTag, onWeightChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = useMemo(() => {
    if (!category) return [];
    if (!searchTerm) return category.tags;
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return category.tags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(lowerCaseSearch) ||
        tag.synonyms?.some((s) => s.toLowerCase().includes(lowerCaseSearch))
    );
  }, [category, searchTerm]);

  if (!category) {
    return (
      <div className="flex items-center justify-center h-full text-bunker-500">
        <p>Select a category to begin</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-white">{category.name}</h2>
      <input
        type="text"
        placeholder={`Search in ${category.name}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-6 bg-bunker-900 border border-bunker-700 rounded-md text-white placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="flex flex-wrap gap-3">
          {filteredTags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              isSelected={!!selectedTags[tag.id]}
              weight={selectedTags[tag.id]?.weight || 1}
              onToggle={onToggleTag}
              onWeightChange={onWeightChange}
              isSuggested={suggestedTagIds.has(tag.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
