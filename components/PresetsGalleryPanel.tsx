import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Preset, Taxonomy, Tag, Category } from '../types';
import { useSettings } from '../index';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';
import { AlertModal } from './AlertModal';
import { ConfirmationModal } from './ConfirmationModal';
import { produce } from 'immer';
import { normalizeTagLabels } from '../utils/normalization';

// --- Types ---
type SortBy = 'order' | 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc';

// --- Color Styles ---
const tagChipColorStyles: Record<NonNullable<Tag['color']>, string> = {
  red:    'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  green:  'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  teal:   'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400',
  blue:   'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400',
  pink:   'border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-400',
  gray:   'border-bunker-300 dark:border-bunker-600 bg-bunker-100 dark:bg-bunker-800 text-bunker-700 dark:text-bunker-300',
};

const categoryDotColorStyles: Record<NonNullable<Tag['color']>, string> = {
  red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500',
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', pink: 'bg-pink-500',
  gray: 'bg-bunker-500',
};

const LoadingSpinner: React.FC<{className?: string}> = ({className = 'h-4 w-4'}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- Main Panel Component ---

interface PresetsGalleryPanelProps {
  taxonomy: Taxonomy;
  onLoadPreset: (preset: Preset) => void;
  onSetView: (view: 'crafter' | 'settings' | 'info') => void;
  callLlm: (systemPrompt: string, userPrompt: string, isResponseTextFreeform?: boolean) => Promise<any>;
}

export const PresetsGalleryPanel: React.FC<PresetsGalleryPanelProps> = ({ taxonomy, onLoadPreset, onSetView, callLlm }) => {
  const { settings, setSettings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('order');
  const [showFavorites, setShowFavorites] = useState(false);
  const [draggedPresetName, setDraggedPresetName] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; variant: 'info' | 'warning' | 'error' } | null>(null);

  const categoryMaps = useMemo(() => {
    const idToNameMap = new Map<string, string>();
    const idToColorMap = new Map<string, NonNullable<Tag['color']>>();
    const tagIdToTagMap = new Map<string, Tag>();

    taxonomy.forEach(cat => {
        idToNameMap.set(cat.id, cat.name);
        if (cat.color) idToColorMap.set(cat.id, cat.color);
        cat.tags.forEach(tag => {
            tagIdToTagMap.set(tag.id, tag);
        });
    });
    return { idToNameMap, idToColorMap, tagIdToTagMap };
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
                    taxonomy={taxonomy}
                    callLlm={callLlm}
                    categoryIdToNameMap={categoryMaps.idToNameMap}
                    categoryIdToColorMap={categoryMaps.idToColorMap}
                    tagIdToTagMap={categoryMaps.tagIdToTagMap}
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
    taxonomy: Taxonomy;
    callLlm: (systemPrompt: string, userPrompt: string, isResponseTextFreeform?: boolean) => Promise<any>;
    categoryIdToNameMap: Map<string, string>;
    categoryIdToColorMap: Map<string, NonNullable<Tag['color']>>;
    tagIdToTagMap: Map<string, Tag>;
    onLoadPreset: () => void;
    isDragged: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, taxonomy, callLlm, categoryIdToNameMap, categoryIdToColorMap, tagIdToTagMap, onLoadPreset, isDragged, onDragStart, onDragEnd, onDrop }) => {
    const { setSettings } = useSettings();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(preset.name);
    const [alert, setAlert] = useState<{ title: string; message: string; variant: 'info' | 'warning' | 'error' } | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; variant: 'primary' | 'danger', confirmText: string } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [aiTitles, setAiTitles] = useState<string[]>([]);
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
    const [titleError, setTitleError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
            setAiTitles([]);
            setTitleError(null);
        }
    }, [isEditing]);

    const promptString = useMemo(() => {
        const orderedCategoryInfo = preset.categoryOrder
            .map(catId => taxonomy.find(c => c.id === catId))
            .filter((c): c is Category => !!c);
        
        const tagObjects = orderedCategoryInfo.flatMap(category => 
            Object.keys(preset.selectedTags)
                .filter(tagId => preset.selectedTags[tagId].categoryId === category.id)
                .map(tagId => tagIdToTagMap.get(tagId))
                .filter((t): t is Tag => !!t)
        );

        const tagLabels = tagObjects.map(tag => tag.label);
        const normalizedLabels = normalizeTagLabels(tagLabels);
        
        const textInputs = orderedCategoryInfo
            .filter(cat => cat.type === 'text' && preset.textCategoryValues?.[cat.id])
            .map(cat => preset.textCategoryValues![cat.id]);

        return [...normalizedLabels, ...textInputs].join(', ');
    }, [preset, taxonomy, tagIdToTagMap]);

    const handleGenerateTitles = async () => {
        setIsGeneratingTitles(true);
        setTitleError(null);
        setAiTitles([]);

        const systemPrompt = `You are an expert at creating concise, evocative, and descriptive names for musical presets based on a list of tags. Your task is to generate 5 creative names.
- Your response MUST be a valid JSON object.
- The JSON object must have a single key: "titles".
- The value of "titles" must be an array of 5 strings.
- Each string should be a short, memorable preset name (2-4 words is ideal).
- Do not include any text, explanations, or markdown formatting outside of the JSON object itself.`;
        
        const userPrompt = `Tags: "${promptString}"`;

        try {
            const result = await callLlm(systemPrompt, userPrompt);
            if (result && Array.isArray(result.titles)) {
                setAiTitles(result.titles);
            } else {
                throw new Error("AI returned an unexpected response format.");
            }
        } catch (e: any) {
            setTitleError(e.message || "An unknown error occurred.");
        } finally {
            setIsGeneratingTitles(false);
        }
    };

    const orderedTags = useMemo(() => {
        const flatTags: { tag: Tag; categoryId: string }[] = [];
        const addedTagIds = new Set<string>();

        // Use preset's category order first
        preset.categoryOrder.forEach(catId => {
            Object.keys(preset.selectedTags).forEach(tagId => {
                const tagData = preset.selectedTags[tagId];
                if (tagData.categoryId === catId && !addedTagIds.has(tagId)) {
                    const fullTag = tagIdToTagMap.get(tagId);
                    if (fullTag) {
                        flatTags.push({ tag: fullTag, categoryId: catId });
                        addedTagIds.add(tagId);
                    }
                }
            });
        });

        // Add any tags from categories not in the order list (for legacy presets)
        Object.keys(preset.selectedTags).forEach(tagId => {
            if (!addedTagIds.has(tagId)) {
                const tagData = preset.selectedTags[tagId];
                const fullTag = tagIdToTagMap.get(tagId);
                if (fullTag) {
                    flatTags.push({ tag: fullTag, categoryId: tagData.categoryId });
                    addedTagIds.add(tagId);
                }
            }
        });

        return flatTags;
    }, [preset, tagIdToTagMap]);

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

    const handleCopy = () => {
        navigator.clipboard.writeText(promptString).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
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
                        <div className="w-full">
                            <div className="relative">
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                                    onBlur={handleRename}
                                    className="form-input w-full text-sm py-1 pr-9"
                                />
                                <button onClick={handleGenerateTitles} disabled={isGeneratingTitles} className="absolute inset-y-0 right-0 flex items-center pr-2 text-bunker-400 hover:text-blue-500 disabled:opacity-50" title="Generate names with AI">
                                    {isGeneratingTitles ? <LoadingSpinner /> : <Icon name="wandSparkles" className="w-4 h-4" />}
                                </button>
                            </div>
                            {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
                            {aiTitles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {aiTitles.map((title, i) => (
                                        <button key={i} onClick={() => setNewName(title)} className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                                            {title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                <p className="text-sm text-bunker-500 dark:text-bunker-400">
                    {preset.description || <span className="italic">No description.</span>}
                </p>

                {/* Tags Display */}
                <div className="my-4 flex-grow min-h-[60px]">
                    {orderedTags.length > 0 ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-2">
                            {orderedTags.map(({ tag, categoryId }) => {
                                const categoryName = categoryIdToNameMap.get(categoryId) || 'Unknown';
                                const categoryColor = categoryIdToColorMap.get(categoryId) || 'gray';
                                const categoryDotClass = categoryDotColorStyles[categoryColor];
                                const tagChipClass = tag.color ? tagChipColorStyles[tag.color] : tagChipColorStyles.gray;

                                return (
                                    <div key={tag.id} className="flex items-center space-x-1.5">
                                        <Tooltip text={categoryName}>
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryDotClass}`} />
                                        </Tooltip>
                                        <div className={`border rounded-full px-2 py-0.5 text-xs font-medium ${tagChipClass}`}>
                                            {tag.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-bunker-500 dark:text-bunker-400 italic flex items-center h-full">No tags selected.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-bunker-200/80 dark:border-bunker-700/80 flex justify-between items-center text-xs">
                    <Tooltip text={`Last updated: ${new Date(preset.updatedAt).toLocaleString()}`}>
                        <span className="text-bunker-400 dark:text-bunker-500">
                            {new Date(preset.updatedAt).toLocaleDateString()}
                        </span>
                    </Tooltip>
                    <div className="flex items-center space-x-1">
                        <Tooltip text="Copy prompt string">
                            <button onClick={handleCopy} className="p-1.5 rounded text-bunker-500 hover:bg-bunker-200 dark:hover:bg-bunker-700 hover:text-green-500">
                                {isCopied ? <Icon name="check" className="w-4 h-4 text-green-500" /> : <Icon name="copy" className="w-4 h-4" />}
                            </button>
                        </Tooltip>
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
