
import React, { useState } from 'react';
import type { Category } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface CategoryListProps {
  categories: Category[];
  activeCategoryId: string;
  selectedTagCounts: Record<string, number>;
  onSelectCategory: (id: string) => void;
  onCategoryOrderChange: (categories: Category[]) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  activeCategoryId,
  selectedTagCounts,
  onSelectCategory,
  onCategoryOrderChange
}) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedItemId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newCategories = [...categories];
      const [removed] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, removed);
      onCategoryOrderChange(newCategories);
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  return (
    <nav className="p-4 bg-bunker-50/50 dark:bg-bunker-900/50 text-bunker-500 dark:text-bunker-300 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 px-2 text-bunker-900 dark:text-white">Categories</h2>
      <ul>
        {categories.map((category) => (
          <li
            key={category.id}
            draggable
            onDragStart={(e) => handleDragStart(e, category.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category.id)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectCategory(category.id)}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
              activeCategoryId === category.id ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800/50'
            } ${draggedItemId === category.id ? 'opacity-50 scale-95' : ''}`}
          >
            <div className="flex items-center">
              <Icon name="grip" className={`w-5 h-5 mr-2 text-bunker-300 dark:text-bunker-600 transition-opacity duration-200 ${activeCategoryId === category.id ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'} cursor-grab`} />
              <Tooltip text={category.description}>
                <span className="font-medium">{category.name}</span>
              </Tooltip>
            </div>
            <div
              className={`w-3 h-3 rounded-full border-2 transition-all ${
                (selectedTagCounts[category.id] || 0) > 0 
                ? `bg-green-500 ${activeCategoryId === category.id ? 'border-white/50' : 'border-bunker-300 dark:border-bunker-500'}` 
                : `bg-transparent ${activeCategoryId === category.id ? 'border-white/30' : 'border-bunker-300 dark:border-bunker-500'}`
              }`}
            ></div>
          </li>
        ))}
      </ul>
    </nav>
  );
};