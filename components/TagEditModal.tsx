import React, { useState, useEffect } from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Tag) => void;
  tag: Tag;
  allTags: Tag[];
}

const colors: NonNullable<Tag['color']>[] = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'];

export const TagEditModal: React.FC<TagEditModalProps> = ({ isOpen, onClose, onSave, tag, allTags }) => {
  const [editedTag, setEditedTag] = useState<Tag>(tag);

  useEffect(() => {
    setEditedTag(tag);
  }, [tag, isOpen]);

  const handleSave = () => {
    if (editedTag.label.trim()) {
      onSave({
          ...editedTag,
          synonyms: editedTag.synonyms?.filter(s => s.trim() !== ''),
          conflictsWith: editedTag.conflictsWith?.filter(c => c.trim() !== '')
      });
    } else {
      alert("Tag label cannot be empty.");
    }
  };

  const handleConflictToggle = (conflictId: string) => {
    setEditedTag(t => {
      const conflicts = t.conflictsWith || [];
      const newConflicts = conflicts.includes(conflictId)
        ? conflicts.filter(id => id !== conflictId)
        : [...conflicts, conflictId];
      return { ...t, conflictsWith: newConflicts };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center pb-3 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg font-bold text-bunker-900 dark:text-white">
            {tag.id ? 'Edit' : 'Add'} Tag
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>
        <div className="flex-grow mt-4 space-y-4 overflow-y-auto pr-2">
          <div>
            <label htmlFor="tag-id" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">ID</label>
            <input
              id="tag-id"
              type="text"
              value={editedTag.id || '(auto-generated from label)'}
              className="form-input bg-bunker-100 dark:bg-bunker-800"
              disabled
            />
          </div>
          <div>
            <label htmlFor="tag-label" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Label</label>
            <input
              id="tag-label"
              type="text"
              value={editedTag.label}
              onChange={e => setEditedTag(t => ({ ...t, label: e.target.value }))}
              className="form-input"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="tag-desc" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Description</label>
            <textarea
              id="tag-desc"
              value={editedTag.description}
              onChange={e => setEditedTag(t => ({ ...t, description: e.target.value }))}
              className="form-input h-24 resize-y"
            />
          </div>
          <div>
            <label htmlFor="tag-synonyms" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Synonyms (comma-separated)</label>
            <input
              id="tag-synonyms"
              type="text"
              value={(editedTag.synonyms || []).join(', ')}
              onChange={e => setEditedTag(t => ({ ...t, synonyms: e.target.value.split(',').map(s => s.trim()) }))}
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="tag-color" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Color</label>
            <select
              id="tag-color"
              value={editedTag.color || 'gray'}
              onChange={e => setEditedTag(t => ({ ...t, color: e.target.value as Tag['color'] }))}
              className="form-input"
            >
              {colors.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Conflicts With</label>
            <div className="mt-2 p-2 h-40 border border-bunker-300 dark:border-bunker-700 rounded-md overflow-y-auto bg-bunker-50 dark:bg-bunker-800/50">
                {allTags.filter(t => t.id !== editedTag.id).map(conflictTag => (
                    <div key={conflictTag.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`conflict-${conflictTag.id}`}
                            checked={(editedTag.conflictsWith || []).includes(conflictTag.id)}
                            onChange={() => handleConflictToggle(conflictTag.id)}
                            className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`conflict-${conflictTag.id}`} className="ml-2 text-sm text-bunker-700 dark:text-bunker-300">{conflictTag.label}</label>
                    </div>
                ))}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 mt-6 flex justify-end space-x-3">
          <button onClick={onClose} type="button" className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} type="button" className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Save Tag
          </button>
        </div>
      </div>
    </div>
  );
};
