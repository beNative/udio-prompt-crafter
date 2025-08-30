
import React, { useState, useEffect } from 'react';
import type { Tag } from '../types';
import { Icon } from './icons';
import { MultiSelectCombobox } from './MultiSelectCombobox';

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
                className="flex-grow bg-transparent focus:outline-none min-w-[100px] text-bunker-900 dark:text-bunker-100"
                placeholder={synonyms.length === 0 ? "Add synonyms..." : ""}
            />
        </div>
    </div>
  );
};

interface TagEditorProps {
  tag: Tag; // The tag to edit, or a template for a new one
  allTags: Tag[];
  onSave: (tag: Tag, originalId: string) => void;
  onCancel: () => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({ tag, allTags, onSave, onCancel }) => {
  const [editedTag, setEditedTag] = useState<Tag>(tag);
  const [originalId, setOriginalId] = useState('');

  useEffect(() => {
    setEditedTag(tag);
    setOriginalId(tag.id);
  }, [tag]);

  const handleSave = () => {
    if (editedTag.label.trim()) {
      const finalTag = { ...editedTag };
      // Clean up empty arrays
      if (!finalTag.synonyms?.length) delete finalTag.synonyms;
      if (!finalTag.conflictsWith?.length) delete finalTag.conflictsWith;
      if (!finalTag.suggests?.length) delete finalTag.suggests;
      onSave(finalTag, originalId);
    } else {
      alert("Tag label cannot be empty.");
    }
  };
  
  const isNew = !originalId;

  return (
    <div className="p-4 bg-bunker-50 dark:bg-bunker-950/50 h-full flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center mb-4">
            <h4 className="font-semibold text-lg">{isNew ? 'Add New Tag' : `Editing "${tag.label}"`}</h4>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="tag-label" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Label</label>
                    <input id="tag-label" type="text" value={editedTag.label} onChange={e => setEditedTag(t => ({ ...t, label: e.target.value }))} className="form-input" autoFocus />
                </div>
                <div>
                    <label htmlFor="tag-id" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">ID</label>
                    <input id="tag-id" type="text" value={editedTag.id} onChange={e => setEditedTag(t => ({ ...t, id: e.target.value.trim() }))} className="form-input" placeholder="(auto-generated if empty)" />
                </div>
            </div>
            <div>
                <label htmlFor="tag-desc" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">Description</label>
                <textarea id="tag-desc" value={editedTag.description} onChange={e => setEditedTag(t => ({ ...t, description: e.target.value }))} className="form-input h-24 resize-y" />
            </div>
            
            <SynonymInput synonyms={editedTag.synonyms || []} onChange={(newSynonyms) => setEditedTag(t => ({...t, synonyms: newSynonyms}))} />

            <div>
                <label className="block text-sm font-medium text-bunker-700 dark:text-bunker-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                        <button key={c} onClick={() => setEditedTag(t => ({ ...t, color: c }))} className={`w-7 h-7 rounded-full transition-transform transform hover:scale-110 ${colorClasses[c]}`}>
                            {editedTag.color === c && <div className="w-full h-full rounded-full ring-2 ring-offset-2 ring-blue-500 ring-offset-white dark:ring-offset-bunker-900"></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelectCombobox title="Suggests" allItems={allTags} selectedIds={editedTag.suggests || []} onChange={(newIds) => setEditedTag(t => ({...t, suggests: newIds}))} tagIdToExclude={editedTag.id || originalId} />
                <MultiSelectCombobox title="Conflicts With" allItems={allTags} selectedIds={editedTag.conflictsWith || []} onChange={(newIds) => setEditedTag(t => ({...t, conflictsWith: newIds}))} tagIdToExclude={editedTag.id || originalId} />
            </div>
        </div>
        
        <div className="flex-shrink-0 mt-6 pt-4 border-t border-bunker-200 dark:border-bunker-800 flex justify-end space-x-3">
              <button onClick={onCancel} type="button" className="rounded-md border border-bunker-300 dark:border-bunker-600 px-4 py-2 bg-white dark:bg-bunker-800 text-sm font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} type="button" className="rounded-md border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
        </div>
    </div>
  );
};
