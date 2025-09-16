
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Preset } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

type SortBy = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc' | 'updated_asc' | 'updated_desc';

const sortPresets = (presets: Preset[], sortBy: SortBy): Preset[] => {
    return [...presets].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'date_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'date_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'updated_asc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            case 'updated_desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            default: return 0;
        }
    });
};

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onUpdatePreset: (presetName: string) => void;
  onDeletePreset: (presetName: string) => void;
  onRenamePreset: (oldName: string, newName: string) => boolean;
  onToggleFavorite: (presetName: string) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  onLoadPreset,
  onUpdatePreset,
  onDeletePreset,
  onRenamePreset,
  onToggleFavorite,
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated_desc');
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    if (editingName && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingName]);
  
  const filteredAndSortedPresets = useMemo(() => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = presets.filter(p => 
          (p.name.toLowerCase().includes(lowerCaseSearch) || p.description?.toLowerCase().includes(lowerCaseSearch)) &&
          (!showFavorites || p.isFavorite)
      );
      return sortPresets(filtered, sortBy);
  }, [presets, searchTerm, sortBy, showFavorites]);

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
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col transform opacity-0 animate-fade-in-scale">
        <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-bunker-200 dark:border-bunker-700">
          <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">Manage Presets</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
            <Icon name="x" className="w-5 h-5 text-bunker-500" />
          </button>
        </div>

        <div className="flex-shrink-0 flex items-center space-x-4 pt-4">
            <div className="relative flex-grow">
                <Icon name="search" className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-bunker-400" />
                <input
                    type="text"
                    placeholder="Search presets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-bunker-100 dark:bg-bunker-900/80 border border-bunker-300 dark:border-bunker-700 rounded-lg text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <Tooltip text="Show only favorites">
              <button onClick={() => setShowFavorites(p => !p)} className={`p-2 rounded-lg transition-colors ${showFavorites ? 'bg-yellow-400/20 text-yellow-500' : 'bg-bunker-100 dark:bg-bunker-800 text-bunker-500 hover:bg-bunker-200'}`}>
                <Icon name="star" className="w-5 h-5"/>
              </button>
            </Tooltip>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="form-input bg-white dark:bg-bunker-800">
                <option value="updated_desc">Last Modified</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
            </select>
        </div>
        
        <div className="flex-grow mt-4 overflow-y-auto pr-2 -mr-2">
          {filteredAndSortedPresets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedPresets.map((preset) => (
                <div key={preset.name} className="bg-bunker-50 dark:bg-bunker-800/50 rounded-lg border border-bunker-200 dark:border-bunker-800 flex flex-col p-4 transition-shadow hover:shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                     {editingName === preset.name ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleConfirmRename}
                            className="form-input flex-grow text-sm"
                        />
                     ) : (
                        <h4 className="font-bold text-bunker-800 dark:text-bunker-100 truncate pr-2">{preset.name}</h4>
                     )}
                     <Tooltip text={preset.isFavorite ? "Unfavorite" : "Favorite"}>
                        <button onClick={() => onToggleFavorite(preset.name)} className={`p-1 rounded-full -mr-1 -mt-1 transition-colors ${preset.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-bunker-300 dark:text-bunker-600 hover:text-yellow-400'}`}>
                           <Icon name="star" className={`w-5 h-5 ${preset.isFavorite ? 'fill-current' : 'fill-none'}`} />
                        </button>
                     </Tooltip>
                  </div>
                  <p className="text-sm text-bunker-500 dark:text-bunker-400 flex-grow min-h-[40px]">
                      {preset.description || <span className="italic">No description.</span>}
                  </p>
                  <div className="mt-4 pt-4 border-t border-bunker-200 dark:border-bunker-700 flex justify-between items-center text-xs">
                     <div className="text-bunker-500 dark:text-bunker-400 space-x-2">
                        <span>{Object.keys(preset.selectedTags).length} tags</span>
                        <span>&bull;</span>
                        <Tooltip text={`Last updated: ${new Date(preset.updatedAt).toLocaleString()}`}>
                           <span>{new Date(preset.updatedAt).toLocaleDateString()}</span>
                        </Tooltip>
                     </div>
                     <div className="flex items-center space-x-1">
                        <Tooltip text="Load preset">
                            <button onClick={() => onLoadPreset(preset)} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-blue-500"><Icon name="load" className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text="Update with current tags">
                            <button onClick={() => onUpdatePreset(preset.name)} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-green-500"><Icon name="upload" className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text="Rename">
                            <button onClick={() => handleStartRename(preset)} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-yellow-500"><Icon name="pencil" className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text="Delete">
                           <button onClick={() => setDeletingName(preset.name)} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                        </Tooltip>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-bunker-500">
              <p>No presets found.</p>
              <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search or filters.' : 'Use the "Save" button in the header to create one.'}</p>
            </div>
          )}
        </div>

        {deletingName && (
             <div className="mt-4 flex-shrink-0 p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg flex items-center justify-between animate-fade-in-scale">
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