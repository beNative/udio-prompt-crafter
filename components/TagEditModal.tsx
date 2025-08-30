import React, { useState, useEffect } from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';
import { MultiSelectTransferList } from './MultiSelectTransferList'; // New component import

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Tag) => void;
  tag: Tag;
  allTags: Tag[];
}

const colors: NonNullable<Tag['color']>[] = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'];

const colorClasses: Record<NonNullable<Tag['color']>, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500',
  gray: 'bg-bunker-500',
};

const SynonymInput: React.FC<{ synonyms: string[]; onChange: (synonyms: string[]) => void; }> = ({ synonyms, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      const newSynonym = inputValue.trim();
      if (!synonyms.includes(newSynonym)) {
        onChange([...synonyms, newSynonym]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue) {
      onChange(synonyms.slice(0, -1));
    }
  };

  const removeSynonym = (synonymToRemove: string) => {
    onChange(synonyms.filter(s => s !== synonymToRemove));
  };

  return (
    <div>
        <label htmlFor="tag-synonyms" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Synonyms</label>
        <div className="form-input flex flex-wrap items-center gap-1.5 p-2 mt-1">
            {synonyms.map(s => (
                <div key={s} className="flex items-center bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-0.5 rounded-md">
                    <span>{s}</span>
                    <button onClick={() => removeSynonym(s)} className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100">
                        <Icon name="x" className="w-3 h-3" />
                    </button>
                </div>
            ))}
            <input
                id="tag-synonyms"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-transparent focus:outline-none min-w-[100px]"
                placeholder={synonyms.length === 0 ? "Add synonyms..." : ""}
            />
        </div>
    </div>
  );
};

export const TagEditModal: React.FC<TagEditModalProps> = ({ isOpen, onClose, onSave, tag, allTags }) => {
  const [editedTag, setEditedTag] = useState<Tag>(tag);

  useEffect(() => {
    setEditedTag(tag);
  }, [tag, isOpen]);

  const handleSave = () => {
    if (editedTag.label.trim()) {
      const finalTag = { ...editedTag };
      // Clean up empty arrays
      if (!finalTag.synonyms?.length) delete finalTag.synonyms;
      if (!finalTag.conflictsWith?.length) delete finalTag.conflictsWith;
      if (!finalTag.suggests?.length) delete finalTag.suggests;
      onSave(finalTag);
    } else {
      alert("Tag label cannot be empty.");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform opacity-0 animate-fade-in-scale" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-bunker-200 dark:border-bunker-700">
          <div className="flex items-center space-x-3">
            <Icon name="tag" className="w-6 h-6 text-bunker-500" />
            <h3 className="text-lg font-bold text-bunker-900 dark:text-white">
              {tag.id ? 'Edit Tag' : 'Add New Tag'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>
        
        <div className="flex-grow min-h-0 grid grid-cols-1 md:grid-cols-2 gap-x-6 p-6 overflow-y-auto">
            {/* Left Column: Core Info */}
            <div className="space-y-4">
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
                    <label htmlFor="tag-desc" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Description</label>
                    <textarea
                      id="tag-desc"
                      value={editedTag.description}
                      onChange={e => setEditedTag(t => ({ ...t, description: e.target.value }))}
                      className="form-input h-24 resize-y"
                    />
                </div>
                <SynonymInput
                    synonyms={editedTag.synonyms || []}
                    onChange={(newSynonyms) => setEditedTag(t => ({...t, synonyms: newSynonyms}))}
                />
                <div>
                    <label className="block text-sm font-medium text-bunker-700 dark:text-bunker-300 mb-2">Color</label>
                    <div className="flex items-center space-x-2">
                        {colors.map(c => (
                            <button key={c} onClick={() => setEditedTag(t => ({ ...t, color: c }))} className={`w-7 h-7 rounded-full transition-transform transform hover:scale-110 ${colorClasses[c]}`}>
                                {editedTag.color === c && <div className="w-full h-full rounded-full ring-2 ring-offset-2 ring-blue-500 ring-offset-white dark:ring-offset-bunker-900"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Right Column: Relationships */}
            <div className="space-y-6 mt-4 md:mt-0">
                <MultiSelectTransferList
                    title="Suggests"
                    allItems={allTags}
                    selectedIds={editedTag.suggests || []}
                    onChange={(newIds) => setEditedTag(t => ({...t, suggests: newIds}))}
                    tagIdToExclude={editedTag.id}
                />
                 <MultiSelectTransferList
                    title="Conflicts With"
                    allItems={allTags}
                    selectedIds={editedTag.conflictsWith || []}
                    onChange={(newIds) => setEditedTag(t => ({...t, conflictsWith: newIds}))}
                    tagIdToExclude={editedTag.id}
                />
            </div>
        </div>

        <div className="flex-shrink-0 p-4 flex justify-between items-center border-t border-bunker-200 dark:border-bunker-700">
            <span className="text-xs text-bunker-500">
                Tip: Press <kbd className="px-1.5 py-0.5 text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded">Enter</kbd> to save.
            </span>
            <div className="flex space-x-3">
              <button onClick={onClose} type="button" className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} type="button" className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Save Tag
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};