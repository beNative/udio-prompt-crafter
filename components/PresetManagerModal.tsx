
import React, { useState, useRef, useEffect } from 'react';
import type { Preset } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onUpdatePreset: (presetName: string) => void;
  onDeletePreset: (presetName: string) => void;
  onRenamePreset: (oldName: string, newName: string) => boolean;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  onLoadPreset,
  onUpdatePreset,
  onDeletePreset,
  onRenamePreset,
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingName]);

  const handleStartRename = (preset: Preset) => {
    setEditingName(preset.name);
    setNewName(preset.name);
  };
  
  const handleConfirmRename = () => {
    if (editingName && newName.trim()) {
      if (onRenamePreset(editingName, newName.trim())) {
        setEditingName(null);
      }
    }
  };
  
  const handleCancelRename = () => {
    setEditingName(null);
  };
  
  const handleConfirmDelete = () => {
      if(deletingName) {
          onDeletePreset(deletingName);
          setDeletingName(null);
      }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col transform opacity-0 animate-fade-in-scale">
        <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">Manage Presets</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>
        
        <div className="flex-grow mt-4 overflow-y-auto pr-2">
          {presets.length > 0 ? (
            <ul className="divide-y divide-bunker-200 dark:divide-bunker-800">
              {presets.map((preset) => (
                <li key={preset.name} className="py-3 flex items-center justify-between group">
                  {editingName === preset.name ? (
                     <div className="flex-grow flex items-center space-x-2">
                         <input
                            ref={editInputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleCancelRename}
                            className="form-input flex-grow"
                         />
                         <button onClick={handleConfirmRename} className="p-2 rounded-md bg-green-500 text-white hover:bg-green-600">
                            <Icon name="check" className="w-4 h-4" />
                         </button>
                     </div>
                  ) : (
                    <button onClick={() => onLoadPreset(preset)} className="flex-grow text-left truncate text-bunker-800 dark:text-bunker-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <span className="font-medium">{preset.name}</span>
                    </button>
                  )}

                  <div className="flex-shrink-0 flex items-center space-x-1 ml-4">
                    <Tooltip text="Update preset with current selection">
                      <button onClick={() => onUpdatePreset(preset.name)} className="p-2 rounded-md text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800 hover:text-blue-500 transition-colors">
                        <Icon name="upload" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <Tooltip text="Rename preset">
                       <button onClick={() => handleStartRename(preset)} className="p-2 rounded-md text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800 hover:text-green-500 transition-colors">
                        <Icon name="pencil" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                     <Tooltip text="Delete preset">
                       <button onClick={() => setDeletingName(preset.name)} className="p-2 rounded-md text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800 hover:text-red-500 transition-colors">
                        <Icon name="trash" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-bunker-500">
              <p>You haven't saved any presets yet.</p>
              <p className="text-sm mt-1">Use the "Save As..." button in the header to create one.</p>
            </div>
          )}
        </div>

        {deletingName && (
             <div className="mt-4 flex-shrink-0 p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg flex items-center justify-between">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    Are you sure you want to delete "{deletingName}"?
                </p>
                <div className="space-x-2">
                    <button onClick={() => setDeletingName(null)} className="px-3 py-1 text-sm rounded-md border border-bunker-300 dark:border-bunker-600 hover:bg-bunker-100 dark:hover:bg-bunker-800">Cancel</button>
                    <button onClick={handleConfirmDelete} className="px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};
