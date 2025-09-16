import React, { useState, useEffect } from 'react';
import { Icon } from './icons';
import { normalizeTagLabels } from '../utils/normalization';
import type { SelectedTag, Category, Taxonomy, Tag } from '../types';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => boolean; // Returns true on success, false on failure (e.g., duplicate name)
  selectedTags: Record<string, SelectedTag>;
  textCategoryValues: Record<string, string>;
  orderedCategories: Category[];
  taxonomy: Taxonomy;
  callLlm: (systemPrompt: string, userPrompt: string, isResponseTextFreeform?: boolean) => Promise<any>;
}

const LoadingSpinner: React.FC<{className?: string}> = ({className = 'h-4 w-4'}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const SavePresetModal: React.FC<SavePresetModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    selectedTags, 
    textCategoryValues, 
    orderedCategories, 
    callLlm 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aiTitles, setAiTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setAiTitles([]);
      setGenerationError(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (onSave(name.trim(), description.trim())) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter in textarea
        e.preventDefault();
        handleSave();
    }
  };
  
  const handleGenerateTitles = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setAiTitles([]);

    const sortedTags = orderedCategories.flatMap(category => 
      Object.values(selectedTags).filter(tag => tag.categoryId === category.id)
    );
    const tagLabels = sortedTags.map(tag => tag.label);
    const normalizedLabels = normalizeTagLabels(tagLabels);
    const textInputs = orderedCategories
        .filter(cat => cat.type === 'text' && textCategoryValues[cat.id])
        .map(cat => textCategoryValues[cat.id]);
    const promptString = [...normalizedLabels, ...textInputs].join(', ');
    
    if (!promptString) {
        setGenerationError("Please select some tags first.");
        setIsGenerating(false);
        return;
    }

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
            throw new Error("Received an unexpected response format from the AI.");
        }
    } catch (e: any) {
        setGenerationError(e.message || "An unknown error occurred.");
    } finally {
        setIsGenerating(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-bunker-900 rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 opacity-0 animate-fade-in-scale">
        <div className="flex justify-between items-center pb-3 border-b border-bunker-200 dark:border-bunker-700">
            <h3 className="text-lg leading-6 font-bold text-bunker-900 dark:text-white">
              Save Preset
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800">
                <Icon name="x" className="w-5 h-5 text-bunker-500" />
            </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">
              Preset Name
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="form-input w-full pr-10"
                autoFocus
              />
              <button onClick={handleGenerateTitles} disabled={isGenerating} className="absolute inset-y-0 right-0 flex items-center pr-3 text-bunker-400 hover:text-blue-500 disabled:opacity-50" title="Generate names with AI">
                  {isGenerating ? <LoadingSpinner /> : <Icon name="wandSparkles" className="w-5 h-5" />}
              </button>
            </div>
            {generationError && <p className="text-xs text-red-500 mt-1">{generationError}</p>}
            {aiTitles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {aiTitles.map((title, i) => (
                        <button key={i} onClick={() => setName(title)} className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            {title}
                        </button>
                    ))}
                </div>
            )}
          </div>
          <div>
            <label htmlFor="preset-description" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">
              Description (Optional)
            </label>
            <div className="mt-1">
              <textarea
                id="preset-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                className="form-input w-full h-24 resize-y"
                placeholder="Add some notes about this preset..."
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="rounded-md border border-bunker-300 dark:border-bunker-600 shadow-sm px-4 py-2 bg-white dark:bg-bunker-800 text-base font-medium text-bunker-700 dark:text-bunker-200 hover:bg-bunker-50 dark:hover:bg-bunker-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-bunker-500 sm:text-sm transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-blue-500 sm:text-sm transition-colors disabled:opacity-50"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
