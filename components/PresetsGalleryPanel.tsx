import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Preset, Taxonomy } from '../types';
import { useSettings } from '../index';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';
import { AlertModal } from './AlertModal';
import { ConfirmationModal } from './ConfirmationModal';
import { produce } from 'immer';

// --- Types ---
type SortBy = 'order' | 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc';

// --- Main Panel Component ---

interface PresetsGalleryPanelProps {
  taxonomy: Taxonomy;
  onLoadPreset: (preset: Preset) => void;
  onSetView: (view: 'crafter' | 'settings' | 'info') => void;
}

export const PresetsGalleryPanel: React.FC<PresetsGalleryPanelProps> = ({ taxonomy, onLoadPreset, onSetView }) => {
  const { settings, setSettings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('order');
  const [showFavorites, setShowFavorites] = useState(false);
  const [draggedPresetName, setDraggedPresetName] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'info' | 'warning' | 'error' } | null>(null);

  const categoryIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    taxonomy.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [taxonomy]);
  
  const filteredAndSortedPresets = useMemo(() => {
    if (!settings) return [];
    
    let presets = [...settings.presets];
    
    if (showFavorites) {
        presets = presets.filter(p => p.isFavorite);
    }
    
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        presets = presets.filter(p => 
            p.name.toLowerCase().includes(lowerCaseSearch) || 
            p.description?.toLowerCase().includes(lowerCaseSearch)
        );
    }

    if (sortBy !== 'order') {
        presets.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'updated_asc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                case 'updated_desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                default: return 0;
            }
        });
    }

    return presets;
  }, [settings?.presets, searchTerm, sortBy, showFavorites]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, presetName: string) => {
    if (sortBy !== 'order') {
        e.preventDefault();
        setAlert({
            title: "Reordering Disabled",
            message: "You can only reorder presets when the sort mode is set to 'Custom Order'.",
            variant: 'info'
        });
        return;
    }
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPresetName(presetName);
  };
  
  const handleDragEnd = () => {
    setDraggedPresetName(null);
  };

  const handleDrop = (targetPresetName: string) => {
    if (!draggedPresetName || draggedPresetName === targetPresetName || !settings) return;

    setSettings(prevSettings => produce(prevSettings, draft => {
        if (!draft) return;
        const draggedIndex = draft.presets.findIndex(p => p.name === draggedPresetName);
        const targetIndex = draft.presets.findIndex(p => p.name === targetPresetName);
        if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedItem] = draft.presets.splice(draggedIndex, 1);
            draft.presets.splice(targetIndex, 0, draggedItem);
        }
    }));
  };

  return (
    <div className="p-8 h-full flex flex-col">
        <div className="pb-5 border-b border-bunker-200 dark:border-bunker-800 flex-shrink-0">
          <h2 className="text-3xl font-bold text-bunker-900 dark:text-white">Preset Gallery</h2>
          <p className="text-bunker-500 dark:text-bunker-400 mt-1">
            Manage your saved presets. Drag and drop cards to create a custom order.
          </p>
        </div>
        
        <div className="flex-shrink-0 flex items-center space-x-4 py-4">
            <div className="relative flex-grow">
                <Icon name="search" className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-bunker-400" />
                <input
                    type="text"
                    placeholder="Search presets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 bg-white dark:bg-bunker-900/80 border border-bunker-300 dark:border-bunker-700 rounded-lg text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <Tooltip text="Show only favorites">
              <button onClick={() => setShowFavorites(p => !p)} className={`p-2 rounded-lg transition-colors ${showFavorites ? 'bg-yellow-400/20 text-yellow-500' : 'bg-bunker-100 dark:bg-bunker-800 text-bunker-500 hover:bg-bunker-200'}`}>
                <Icon name="star" className="w-5 h-5"/>
              </button>
            </Tooltip>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="form-input bg-white dark:bg-bunker-800">
                <option value="order">Custom Order</option>
                <option value="updated_desc">Last Modified</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
            </select>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto pr-2 -mr-4">
          {filteredAndSortedPresets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedPresets.map(preset => (
                <PresetCard 
                    key={preset.name}
                    preset={preset}
                    taxonomyMap={categoryIdToNameMap}
                    onLoadPreset={() => { onLoadPreset(preset); onSetView('crafter'); }}
                    isDragged={draggedPresetName === preset.name}
                    onDragStart={(e) => handleDragStart(e, preset.name)}
                    onDragEnd={handleDragEnd}
                    onDrop={() => handleDrop(preset.name)}
                />
              ))}
            </div>
          ) : (
             <div className="text-center py-16 text-bunker-500">
              <p>No presets found.</p>
              <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search or filters.' : 'Use the "Save" button in the header to create one.'}</p>
            </div>
          )}
        </div>
        {alert && <AlertModal isOpen={true} onClose={() => setAlert(null)} {...alert} />}
    </div>
  );
};

// --- Preset Card Component ---

interface PresetCardProps {
    preset: Preset;
    taxonomyMap: Map<string, string>;
    onLoadPreset: () => void;
    isDragged: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, taxonomyMap, onLoadPreset, isDragged, onDragStart, onDragEnd, onDrop }) => {
    const { setSettings } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(preset.name);
    const [alert, setAlert] = useState<{ title: string; message: string; variant: 'info' | 'warning' | 'error' } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; variant: 'primary' | 'danger', confirmText: string } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [isEditing]);

    const tagCountsByCategory = useMemo(() => {
        return Object.values(preset.selectedTags).reduce((acc, tag) => {
            const catName = taxonomyMap.get(tag.categoryId) || 'Other';
            acc[catName] = (acc[catName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [preset.selectedTags, taxonomyMap]);

    const handleToggleFavorite = () => {
        setSettings(prev => produce(prev, draft => {
            if (!draft) return;
            const p = draft.presets.find(p => p.name === preset.name);
            if (p) p.isFavorite = !p.isFavorite;
        }));
    };

    const handleRename = () => {
        if (newName.trim() === preset.name) {
            setIsEditing(false);
            return;
        }
        
        let success = true;
        setSettings(prev => {
            if (!prev) return prev;
            if (newName.trim() && prev.presets.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
                setAlert({ title: "Duplicate Name", message: `A preset named "${newName.trim()}" already exists.`, variant: 'error' });
                success = false;
                return prev;
            }
            return produce(prev, draft => {
                const p = draft.presets.find(p => p.name === preset.name);
                if (p) {
                    p.name = newName.trim();
                    p.updatedAt = new Date().toISOString();
                }
            });
        });

        if (success) {
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        setConfirmation({
            title: "Delete Preset?",
            message: `Are you sure you want to delete the preset "${preset.name}"? This action cannot be undone.`,
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: () => {
                setSettings(prev => produce(prev, draft => {
                    if (!draft) return;
                    draft.presets = draft.presets.filter(p => p.name !== preset.name);
                }));
            }
        });
    };

    return (
        <>
            <div 
                draggable 
                onDragStart={onDragStart} 
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={`bg-white dark:bg-bunker-900 rounded-lg border border-bunker-200 dark:border-bunker-700 flex flex-col p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab ${isDragged ? 'opacity-30' : ''}`}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    {isEditing ? (
                        <input
                            ref={editInputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                            onBlur={handleRename}
                            className="form-input flex-grow text-sm py-1"
                        />
                    ) : (
                        <h4 className="font-bold text-bunker-800 dark:text-bunker-100 truncate pr-2">{preset.name}</h4>
                    )}
                    <Tooltip text={preset.isFavorite ? "Unfavorite" : "Favorite"}>
                        <button onClick={handleToggleFavorite} className={`p-1 rounded-full -mr-1 -mt-1 transition-colors ${preset.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-bunker-300 dark:text-bunker-600 hover:text-yellow-400'}`}>
                            <Icon name="star" className={`w-5 h-5 ${preset.isFavorite ? 'fill-current' : 'fill-none'}`} />
                        </button>
                    </Tooltip>
                </div>
                
                {/* Description */}
                <p className="text-sm text-bunker-500 dark:text-bunker-400 flex-grow min-h-[40px]">
                    {preset.description || <span className="italic">No description.</span>}
                </p>

                {/* Tag Counts */}
                <div className="my-4">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(tagCountsByCategory).map(([name, count]) => (
                            <div key={name} className="px-2 py-0.5 bg-bunker-100 dark:bg-bunker-800 rounded-full text-xs font-medium text-bunker-600 dark:text-bunker-300">
                                {name}: <span className="font-semibold text-bunker-800 dark:text-bunker-100">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-bunker-200/80 dark:border-bunker-700/80 flex justify-between items-center text-xs">
                    <Tooltip text={`Last updated: ${new Date(preset.updatedAt).toLocaleString()}`}>
                        <span className="text-bunker-400 dark:text-bunker-500">
                            {new Date(preset.updatedAt).toLocaleDateString()}
                        </span>
                    </Tooltip>
                    <div className="flex items-center space-x-1">
                        <Tooltip text="Load preset">
                            <button onClick={onLoadPreset} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-blue-500"><Icon name="load" className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text="Rename">
                            <button onClick={() => setIsEditing(true)} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-yellow-500"><Icon name="pencil" className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text="Delete">
                            <button onClick={handleDelete} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            {alert && <AlertModal isOpen={true} onClose={() => setAlert(null)} {...alert} />}
            {confirmation && <ConfirmationModal isOpen={true} onClose={() => setConfirmation(null)} {...confirmation} />}
        </>
    );
};
