import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Tag, Preset, Macro } from '../types';
import { Icon } from './icons';

// Define a unified type for palette items
type Command = 
  | { type: 'tag'; data: Tag }
  | { type: 'action'; data: { id: string; name: string; icon: string; handler: () => void; } };

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  presets: Preset[];
  macros: Macro[];
  onToggleTag: (tag: Tag) => void;
  onLoadPreset: (preset: Preset) => void;
  onApplyMacro: (macro: Macro) => void;
  onSavePreset: () => void;
  onRandomize: () => void;
  onClear: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tags,
  presets,
  macros,
  onToggleTag,
  onLoadPreset,
  onApplyMacro,
  onSavePreset,
  onRandomize,
  onClear,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  // Memoize the list of commands to avoid re-creating on every render
  const allCommands = useMemo<Command[]>(() => {
    const actions: Command[] = [
      { type: 'action', data: { id: 'clear', name: 'Clear All Tags', icon: 'trash', handler: onClear } },
      { type: 'action', data: { id: 'randomize', name: 'Randomize Tags', icon: 'sparkles', handler: onRandomize } },
      { type: 'action', data: { id: 'save', name: 'Save as Preset', icon: 'save', handler: onSavePreset } },
    ];
    
    presets.forEach(preset => {
      actions.push({ type: 'action', data: { id: `preset-${preset.name}`, name: `Preset: ${preset.name}`, icon: 'load', handler: () => onLoadPreset(preset) }});
    });

    macros.forEach(macro => {
      actions.push({ type: 'action', data: { id: `macro-${macro.name}`, name: `Macro: ${macro.name}`, icon: 'wandSparkles', handler: () => onApplyMacro(macro) }});
    });

    const tagCommands: Command[] = tags.map(tag => ({ type: 'tag', data: tag }));

    return [...actions, ...tagCommands];
  }, [tags, presets, macros, onClear, onRandomize, onSavePreset, onLoadPreset, onApplyMacro]);

  const filteredCommands = useMemo<Command[]>(() => {
    if (!searchTerm) {
        // Show actions first when there's no search term
        const actions = allCommands.filter(c => c.type === 'action');
        const tags = allCommands.filter(c => c.type === 'tag');
        return [...actions, ...tags];
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

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Handle keyboard navigation for the palette itself
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeCommand = filteredCommands[activeIndex];
        if (activeCommand) {
          if (activeCommand.type === 'tag') {
            onToggleTag(activeCommand.data);
          } else {
            activeCommand.data.handler();
          }
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onToggleTag, onClose]);
  
  // Scroll active item into view
  useEffect(() => {
      resultsRef.current?.children[activeIndex]?.scrollIntoView({
          block: 'nearest',
      });
  }, [activeIndex]);

  if (!isOpen) return null;

  const handleExecute = (command: Command) => {
    if (command.type === 'tag') {
      onToggleTag(command.data);
    } else {
      command.data.handler();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 p-4 pt-[15vh]" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="relative">
           <Icon name="search" className="absolute top-3.5 left-4 w-5 h-5 text-bunker-400" />
           <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setActiveIndex(0); }}
            placeholder="Search for tags or commands..."
            className="w-full bg-transparent p-3 pl-12 text-bunker-800 dark:text-white border-b border-bunker-200 dark:border-bunker-700 focus:outline-none"
           />
        </div>
        <ul ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
            {filteredCommands.length > 0 ? filteredCommands.map((command, index) => (
                <li key={command.type === 'tag' ? command.data.id : command.data.id}
                    className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${index === activeIndex ? 'bg-blue-600 text-white' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800'}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleExecute(command)}
                >
                    {command.type === 'action' ? (
                        <>
                           <Icon name={command.data.icon} className={`w-5 h-5 ${index === activeIndex ? 'text-white' : 'text-bunker-500'}`} />
                           <span>{command.data.name}</span>
                        </>
                    ) : (
                        <>
                           <span className={`w-5 h-5 text-center font-bold ${index === activeIndex ? 'text-blue-200' : 'text-bunker-400'}`}>#</span>
                           <span className={`${index === activeIndex ? 'text-white' : 'text-bunker-800 dark:text-bunker-200'}`}>{command.data.label}</span>
                           <span className={`text-xs ml-auto truncate ${index === activeIndex ? 'text-blue-200' : 'text-bunker-400'}`}>{command.data.description}</span>
                        </>
                    )}
                </li>
            )) : (
                <li className="p-4 text-center text-bunker-500">No results found.</li>
            )}
        </ul>
      </div>
    </div>
  );
};
