import React from 'react';
import type { Tag } from '../types';
import { Tooltip } from './Tooltip';
import { Icon } from './icons';

interface TagChipProps {
  tag: Tag;
  isSelected: boolean;
  onToggle: (tag: Tag) => void;
  isLocked: boolean;
  onToggleLock: (tagId: string) => void;
}

const colorStyles: Record<NonNullable<Tag['color']>, string> = {
  red:    'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 dark:hover:bg-red-500/20',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300 dark:hover:bg-orange-500/20',
  yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-500/20',
  green:  'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 dark:hover:bg-green-500/20',
  teal:   'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 dark:hover:bg-teal-500/20',
  blue:   'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/20',
  indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-500/20',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 dark:hover:bg-purple-500/20',
  pink:   'border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300 dark:hover:bg-pink-500/20',
  gray:   'border-bunker-500/30 bg-bunker-500/10 text-bunker-700 dark:text-bunker-300 dark:hover:bg-bunker-500/20',
};

export const TagChip: React.FC<TagChipProps> = ({ tag, isSelected, onToggle, isLocked, onToggleLock }) => {

  const handleToggle = () => {
    onToggle(tag);
  };
  
  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(tag.id);
  };

  const baseStyle = "group flex items-center space-x-2 border rounded-full px-3 py-1 text-sm transition-all duration-200 cursor-pointer transform hover:scale-105";
  
  const selectedStyle = "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-offset-2 ring-blue-500 ring-offset-bunker-50 dark:ring-offset-bunker-950";
  
  const defaultUnselectedStyle = "bg-white border-bunker-200 text-bunker-700 hover:border-blue-500 hover:bg-bunker-50 dark:bg-bunker-800/50 dark:text-bunker-300 dark:border-bunker-700 dark:hover:bg-bunker-700/60";
  const unselectedStyle = tag.color ? colorStyles[tag.color] : defaultUnselectedStyle;

  const tooltipText = (
    <div className="text-left">
        <p className="font-bold">{tag.label}</p>
        <p className="mt-1">{tag.description}</p>
        {tag.example_snippet && <p className="mt-2 text-bunker-300 italic">e.g., "{tag.example_snippet}"</p>}
    </div>
  );


  return (
    <div
      onClick={handleToggle}
      className={`${baseStyle} ${isSelected ? selectedStyle : unselectedStyle}`}
      aria-pressed={isSelected}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
    >
      {isSelected ? (
        <button 
          onClick={handleToggleLock} 
          className="flex items-center justify-center -ml-1 mr-1 p-0.5 rounded-full hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white" 
          aria-label={isLocked ? 'Unlock tag' : 'Lock tag'}
        >
          <Icon name="lock-closed" className={`w-4 h-4 transition-colors ${isLocked ? 'text-white' : 'text-white/40'}`} />
        </button>
      ) : (
        <div className={`w-2 h-2 rounded-full border ${tag.color ? 'border-current opacity-50' : 'border-bunker-300 dark:border-bunker-600' } group-hover:border-blue-500 transition-colors`}/>
      )}
      
      <span>{tag.label}</span>
      
      <Tooltip text={tooltipText}>
        <button 
          onClick={(e) => { e.stopPropagation(); }} 
          className="p-0 m-0 leading-none appearance-none bg-transparent border-none" 
          aria-label={`More info about ${tag.label}`}
        >
            <Icon name="info" className={`w-4 h-4 transition-colors ${isSelected ? 'text-white/70 hover:text-white' : 'text-bunker-400 group-hover:text-bunker-600 dark:group-hover:text-bunker-200'}`} />
        </button>
      </Tooltip>
    </div>
  );
};