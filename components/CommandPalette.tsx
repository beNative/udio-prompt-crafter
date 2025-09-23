import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import type { Tag, Preset } from '../types';
import { Icon } from './icons';

// Define a unified type for palette items
type Command = 
  | { type: 'tag'; data: Tag }
  | { type: 'action'; data: { id: string; name: string; icon: string; handler: () => void; } };

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  tags: Tag[];
  presets: Preset[];
  onToggleTag: (tag: Tag) => void;
  onLoadPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onRandomize: () => void;
  onClear: () => void;
  style: React.CSSProperties;
}

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(({
  isOpen,
  onClose,
  searchTerm,
  tags,
  presets,
  onToggleTag,
  onLoadPreset,
  onSavePreset,
  onRandomize,
  onClear,
  style,
}, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const resultsRef = useRef<HTMLUListElement>(null);

  // Memoize the list of commands to avoid re-creating on every render
  const allCommands = useMemo<Command[]>(() => {
    const actions: Command[] = [
      { type: 'action', data: { id: 'clear', name: 'Clear All Tags', icon: 'trash', handler: onClear } },
      { type: 'action', data: { id: 'randomize', name: 'Randomize Tags', icon: 'sparkles', handler: onRandomize } },
      { type: 'action', data: { id: 'save', name: 'Save as Preset...', icon: 'save', handler: onSavePreset } },
    ];
    
    presets.forEach(preset => {
      actions.push({ type: 'action', data: { id: `preset-${preset.name}`, name: `Preset: ${preset.name}`, icon: 'load', handler: () => onLoadPreset(preset) }});
    });

    const tagCommands: Command[] = tags.map(tag => ({ type: 'tag', data: tag }));

    return [...actions, ...tagCommands];
  }, [tags, presets, onClear, onRandomize, onSavePreset, onLoadPreset]);

  const filteredCommands = useMemo<Command[]>(() => {
    if (!searchTerm) {
        // Show actions first when there's no search term
        const actions = allCommands.filter(c => c.type === 'action');
        const presets = allCommands.filter(c => c.type === 'action' && c.data.name.startsWith('Preset:'));
        const otherActions = actions.filter(a => !a.data.name.startsWith('Preset:'));
        return [...otherActions, ...presets];
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    return allCommands.filter(command => {
      if (command.type === 'tag') {
        return command.data.label.toLowerCase().includes(lowerCaseSearch) ||
               command.data.synonyms?.some(s => s.toLowerCase().includes(lowerCaseSearch));
      }
      return command.data.name.toLowerCase().includes(lowerCaseSearch);
    });
  }, [searchTerm, allCommands]);

  useEffect(() => {
      setActiveIndex(0);
  }, [searchTerm]);
  
  // Handle keyboard navigation for the palette itself
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeCommand = filteredCommands[activeIndex];
        if (activeCommand) {
          handleExecute(activeCommand);
        }
      }
    };

    // We listen on the input field in the TitleBar, but need to control the palette
    // Let's attach this to window while the palette is open
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);
  
  // Scroll active item into view
  useEffect(() => {
      resultsRef.current?.children[activeIndex]?.scrollIntoView({
          block: 'nearest',
      });
  }, [activeIndex]);

  const handleExecute = (command: Command) => {
    if (command.type === 'tag') {
      onToggleTag(command.data);
    } else {
      command.data.handler();
    }
    onClose();
  };
  
  if (!isOpen) return null;

  return (
      <div 
        ref={ref} 
        style={style}
        className="fixed bg-white dark:bg-bunker-900/95 border border-bunker-200 dark:border-bunker-700 rounded-lg shadow-2xl z-50 animate-fade-in-scale" 
        onClick={e => e.stopPropagation()}
      >
        <ul ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
            {filteredCommands.length > 0 ? filteredCommands.map((command, index) => (
                <li key={command.type === 'tag' ? command.data.id : command.data.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-md cursor-pointer transition-colors ${index === activeIndex ? 'bg-blue-600 text-white' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800'}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleExecute(command);
                    }}
                >
                    {command.type === 'action' ? (
                        <>
                           <Icon name={command.data.icon} className={`w-5 h-5 ${index === activeIndex ? 'text-white' : 'text-bunker-500'}`} />
                           <span className="font-medium">{command.data.name}</span>
                        </>
                    ) : (
                        <>
                           <Icon name="tag" className={`w-5 h-5 ${index === activeIndex ? 'text-blue-200' : 'text-bunker-400'}`} />
                           <span className={`font-medium ${index === activeIndex ? 'text-white' : 'text-bunker-800 dark:text-bunker-200'}`}>{command.data.label}</span>
                           <span className={`text-xs ml-auto truncate ${index === activeIndex ? 'text-blue-200' : 'text-bunker-400'}`}>{command.data.description}</span>
                        </>
                    )}
                </li>
            )) : (
                <li className="p-4 text-center text-sm text-bunker-500">No results found for "{searchTerm}".</li>
            )}
        </ul>
      </div>
  );
});