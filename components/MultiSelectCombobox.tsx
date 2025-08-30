import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';

interface MultiSelectComboboxProps {
  title: string;
  allItems: Tag[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  tagIdToExclude: string;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({ title, allItems, selectedIds, onChange, tagIdToExclude }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return allItems.filter(item => selectedSet.has(item.id));
  }, [allItems, selectedIds]);

  const availableItems = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const lowerInput = inputValue.toLowerCase();
    return allItems.filter(item => 
        item.id !== tagIdToExclude && 
        !selectedSet.has(item.id) &&
        item.label.toLowerCase().includes(lowerInput)
    );
  }, [allItems, selectedIds, tagIdToExclude, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (itemId: string) => {
    onChange([...selectedIds, itemId]);
    setInputValue('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleDeselect = (itemId: string) => {
    onChange(selectedIds.filter(id => id !== itemId));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % availableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + availableItems.length) % availableItems.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(availableItems[activeIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Backspace' && inputValue === '' && selectedItems.length > 0) {
      handleDeselect(selectedItems[selectedItems.length - 1].id);
    }
  };

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">{title}</label>
      <div className="relative mt-1">
        <div className="form-input flex flex-wrap items-center gap-1.5 p-2 min-h-[42px]" onClick={() => inputRef.current?.focus()}>
          {selectedItems.map(item => (
            <div key={item.id} className="flex items-center bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-0.5 rounded-md">
              <span>{item.label}</span>
              <button onClick={() => handleDeselect(item.id)} className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100">
                <Icon name="x" className="w-3 h-3" />
              </button>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
                setInputValue(e.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-grow bg-transparent focus:outline-none min-w-[120px]"
            placeholder="Search to add..."
          />
        </div>
        {isOpen && availableItems.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-bunker-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {availableItems.map((item, index) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item.id)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-bunker-900 dark:text-bunker-200 ${activeIndex === index ? 'bg-bunker-100 dark:bg-bunker-700' : ''}`}
              >
                <span className="block truncate">{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
