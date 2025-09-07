import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import { Icon } from './icons';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  category: Category;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ isOpen, onClose, onSave, category }) => {
  const [editedCategory, setEditedCategory] = useState<Category>(category);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditedCategory(category);
    setError('');
  }, [category, isOpen]);

  const handleSave = () => {
    if (editedCategory.name.trim()) {
      onSave(editedCategory);
    } else {
      setError("Category name cannot be empty.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg font-bold text-bunker-900 dark:text-white">
            {category.id ? 'Edit' : 'Add'} Category
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="cat-name" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Name</label>
            <input
              id="cat-name"
              type="text"
              value={editedCategory.name}
              onChange={e => { setEditedCategory(c => ({ ...c, name: e.target.value })); setError(''); }}
              className="form-input"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label htmlFor="cat-desc" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Description</label>
            <textarea
              id="cat-desc"
              value={editedCategory.description || ''}
              onChange={e => setEditedCategory(c => ({ ...c, description: e.target.value }))}
              className="form-input h-24 resize-y"
            />
          </div>
          <div>
            <label htmlFor="cat-type" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Type</label>
            <select
              id="cat-type"
              value={editedCategory.type || 'tags'}
              onChange={e => setEditedCategory(c => ({ ...c, type: e.target.value as Category['type'] }))}
              className="form-input"
            >
              <option value="tags">Tags</option>
              <option value="text">Text Input</option>
              <option value="helper_input">Helper Input</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} type="button" className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} type="button" className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Save Category
          </button>
        </div>
      </div>
    </div>
  );
};