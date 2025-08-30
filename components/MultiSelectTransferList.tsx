import React, { useState, useMemo } from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';

interface MultiSelectTransferListProps {
  title: string;
  allItems: Tag[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  tagIdToExclude: string;
}

export const MultiSelectTransferList: React.FC<MultiSelectTransferListProps> = ({ title, allItems, selectedIds, onChange, tagIdToExclude }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { availableItems, selectedItems } = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const available = allItems.filter(item => item.id !== tagIdToExclude && !selectedSet.has(item.id));
    const selected = allItems.filter(item => selectedSet.has(item.id));
    return { availableItems: available, selectedItems: selected };
  }, [allItems, selectedIds, tagIdToExclude]);

  const filteredAvailableItems = useMemo(() => {
    if (!searchTerm) return availableItems;
    const lowerSearch = searchTerm.toLowerCase();
    return availableItems.filter(item => item.label.toLowerCase().includes(lowerSearch));
  }, [searchTerm, availableItems]);

  const handleSelect = (itemId: string) => {
    onChange([...selectedIds, itemId]);
  };

  const handleDeselect = (itemId: string) => {
    onChange(selectedIds.filter(id => id !== itemId));
  };

  const ListItem: React.FC<{ item: Tag; onSelect: () => void; icon: 'plus' | 'x'; }> = ({ item, onSelect, icon }) => (
    <li className="flex items-center justify-between p-1.5 rounded-md hover:bg-bunker-100 dark:hover:bg-bunker-800/60">
      <span className="text-sm truncate pr-2">{item.label}</span>
      <button onClick={onSelect} className="p-1 rounded-full text-bunker-400 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-bunker-600 dark:hover:text-white transition-colors">
        <Icon name={icon} className="w-4 h-4" />
      </button>
    </li>
  );

  return (
    <div className="flex flex-col flex-grow min-h-64">
      <label className="block text-sm font-medium text-bunker-700 dark:text-bunker-300 mb-2">{title}</label>
      <div className="grid grid-cols-2 gap-3 flex-grow min-h-0">
        {/* Available Items Column */}
        <div className="flex flex-col border border-bunker-300 dark:border-bunker-700 rounded-md bg-bunker-50 dark:bg-bunker-800/50">
          <div className="relative p-2 border-b border-bunker-200 dark:border-bunker-700">
            <Icon name="search" className="absolute top-1/2 left-4 -translate-y-1/2 w-4 h-4 text-bunker-400" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm bg-transparent pl-7 py-1 focus:outline-none"
            />
          </div>
          <ul className="flex-grow p-1 overflow-y-auto">
            {filteredAvailableItems.map(item => <ListItem key={item.id} item={item} onSelect={() => handleSelect(item.id)} icon="plus" />)}
          </ul>
        </div>
        {/* Selected Items Column */}
        <div className="flex flex-col border border-bunker-300 dark:border-bunker-700 rounded-md bg-white dark:bg-bunker-900">
           <h5 className="p-2 border-b border-bunker-200 dark:border-bunker-700 text-sm font-semibold text-bunker-600 dark:text-bunker-300">
                Selected ({selectedItems.length})
            </h5>
          <ul className="flex-grow p-1 overflow-y-auto">
            {selectedItems.map(item => <ListItem key={item.id} item={item} onSelect={() => handleDeselect(item.id)} icon="x" />)}
          </ul>
        </div>
      </div>
    </div>
  );
};