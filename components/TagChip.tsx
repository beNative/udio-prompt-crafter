
import React from 'react';
import type { Tag } from '../types';
import { Tooltip } from './Tooltip';
import { Icon } from './icons';

interface TagChipProps {
  tag: Tag;
  isSelected: boolean;
  weight: number;
  onToggle: (tag: Tag) => void;
  onWeightChange: (tagId: string, weight: number) => void;
  isSuggested?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({ tag, isSelected, weight, onToggle, onWeightChange, isSuggested = false }) => {
  const weights = [0.5, 1.0, 1.5, 2.0];

  const baseStyle = "flex items-center space-x-2 border rounded-full px-3 py-1 text-sm cursor-pointer transition-all duration-200";
  const selectedStyle = "bg-blue-600 text-white border-blue-600 shadow-md";
  const unselectedStyle = "bg-bunker-800/50 dark:bg-bunker-800 border-bunker-700 hover:border-blue-500 hover:bg-bunker-700";
  const suggestedStyle = "border-dashed border-green-500";

  return (
    <div
      onClick={() => onToggle(tag)}
      className={`${baseStyle} ${isSelected ? selectedStyle : unselectedStyle} ${isSuggested && !isSelected ? suggestedStyle : ''}`}
      aria-pressed={isSelected}
      role="button"
      tabIndex={0}
    >
      <span>{tag.emoji} {tag.label}</span>
      {isSelected && (
        <div className="flex items-center space-x-1" role="group" aria-label={`Weight for ${tag.label}`}>
          {weights.map((w) => (
            <button
              key={w}
              onClick={(e) => {
                e.stopPropagation();
                onWeightChange(tag.id, w);
              }}
              className={`w-6 h-5 text-xs rounded-full transition-colors ${
                weight === w ? 'bg-white text-blue-600 font-bold' : 'bg-blue-500/50 text-white hover:bg-blue-400/50'
              }`}
              aria-pressed={weight === w}
              title={`Set weight to ${w}x`}
            >
              {w.toFixed(1)}
            </button>
          ))}
        </div>
      )}
      <Tooltip text={
        <div className="text-left">
            <p className="font-bold">{tag.label}</p>
            <p className="mt-1">{tag.description}</p>
            {tag.example_snippet && <p className="mt-2 text-gray-300 italic">e.g., "{tag.example_snippet}"</p>}
        </div>
      }>
        <button onClick={(e) => e.stopPropagation()} className="p-0 m-0 leading-none" aria-label={`More info about ${tag.label}`}>
            <Icon name="info" className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-bunker-400'}`} />
        </button>
      </Tooltip>
    </div>
  );
};
