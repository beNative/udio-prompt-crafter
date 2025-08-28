import React from 'react';
import type { Tag } from '../types';
import { Tooltip } from './Tooltip';
import { Icon } from './icons';

interface TagChipProps {
  tag: Tag;
  isSelected: boolean;
  onToggle: (tag: Tag) => void;
  isImplied: boolean;
  implyingTagLabel?: string;
}

const colorStyles: Record<NonNullable<Tag['color']>, string> = {
  red:    'border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-200 hover:border-red-400 dark:hover:bg-red-900/70',
  orange: 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-200 hover:border-orange-400 dark:hover:bg-orange-900/70',
  yellow: 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200 hover:border-yellow-400 dark:hover:bg-yellow-900/70',
  green:  'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-200 hover:border-green-400 dark:hover:bg-green-900/70',
  teal:   'border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-700 dark:bg-teal-900/50 dark:text-teal-200 hover:border-teal-400 dark:hover:bg-teal-900/70',
  blue:   'border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-200 hover:border-blue-400 dark:hover:bg-blue-900/70',
  indigo: 'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200 hover:border-indigo-400 dark:hover:bg-indigo-900/70',
  purple: 'border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/50 dark:text-purple-200 hover:border-purple-400 dark:hover:bg-purple-900/70',
  pink:   'border-pink-300 bg-pink-100 text-pink-800 dark:border-pink-700 dark:bg-pink-900/50 dark:text-pink-200 hover:border-pink-400 dark:hover:bg-pink-900/70',
  gray:   'border-bunker-200 bg-bunker-100 text-bunker-700 dark:border-bunker-700 dark:bg-bunker-800/50 dark:text-bunker-300 hover:border-bunker-400 dark:hover:bg-bunker-700',
};

export const TagChip: React.FC<TagChipProps> = ({ tag, isSelected, onToggle, isImplied, implyingTagLabel }) => {

  const handleToggle = () => {
    if (!isImplied) {
      onToggle(tag);
    }
  };

  const baseStyle = "flex items-center space-x-2 border rounded-full px-3 py-1 text-sm transition-all duration-200";
  const selectedStyle = "bg-blue-600 text-white border-blue-600 shadow-md";
  
  const defaultUnselectedStyle = "bg-bunker-100 text-bunker-700 border-bunker-200 hover:border-blue-500 hover:bg-bunker-200 dark:bg-bunker-800/50 dark:text-bunker-300 dark:border-bunker-700 dark:hover:bg-bunker-700";
  const unselectedStyle = tag.color ? colorStyles[tag.color] : defaultUnselectedStyle;

  const impliedStyle = "border-dashed border-purple-400 bg-purple-100 text-purple-800 dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-200";

  const cursorStyle = isImplied ? 'cursor-help' : 'cursor-pointer';

  const tooltipText = isImplied ? (
    <div className="text-left">
        <p className="font-bold">{tag.label} (Auto-selected)</p>
        <p className="mt-1">This tag was automatically added because you selected '{implyingTagLabel}'.</p>
    </div>
  ) : (
    <div className="text-left">
        <p className="font-bold">{tag.label}</p>
        <p className="mt-1">{tag.description}</p>
        {tag.example_snippet && <p className="mt-2 text-gray-300 italic">e.g., "{tag.example_snippet}"</p>}
    </div>
  );


  return (
    <div
      onClick={handleToggle}
      className={`${baseStyle} ${cursorStyle} ${isSelected ? (isImplied ? impliedStyle : selectedStyle) : unselectedStyle}`}
      aria-pressed={isSelected}
      role="button"
      tabIndex={isImplied ? -1 : 0}
    >
      <span>{tag.emoji} {tag.label}</span>
      <Tooltip text={tooltipText}>
        <button onClick={(e) => e.stopPropagation()} className="p-0 m-0 leading-none" aria-label={`More info about ${tag.label}`}>
            <Icon name="info" className={`w-4 h-4 ${isSelected ? (isImplied ? 'text-purple-800 dark:text-purple-200' : 'text-white') : ''}`} />
        </button>
      </Tooltip>
    </div>
  );
};