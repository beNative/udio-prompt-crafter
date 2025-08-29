import React, { useState, useCallback, useMemo } from 'react';
import type { Category, SelectedTag, Tag } from '../types';
import { Icon } from './icons';
import { TagChip } from './TagChip';

interface AiFeaturesProps {
    category: Category;
    selectedTags: Record<string, SelectedTag>;
    taxonomyMap: Map<string, Tag & { categoryId: string }>;
    callLlm: (systemPrompt: string, userPrompt: string) => Promise<any>;
    onToggleTag: (tag: Tag) => void;
    onSetLyricText: (text: string) => void;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const AiFeatures: React.FC<AiFeaturesProps> = ({ category, selectedTags, taxonomyMap, callLlm, onToggleTag, onSetLyricText }) => {
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);

    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [lyricError, setLyricError] = useState<string | null>(null);
    const [lyricIdeas, setLyricIdeas] = useState<string[]>([]);
    
    const handleSuggestTags = useCallback(async () => {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        setSuggestedTags([]);

        const selectedInCategory = Object.values(selectedTags).filter(t => t.categoryId === category.id);
        if (selectedInCategory.length === 0) {
            setSuggestionError("Please select at least one tag in this category to get suggestions.");
            setIsLoadingSuggestions(false);
            return;
        }

        const systemPrompt = `You are an expert music recommender AI. Your task is to suggest complementary music style tags. The user will provide a list of currently selected tags for a category. You will be given a JSON object of all available tags in that category. You must suggest up to 5 new tags that would creatively expand on the user's selection. Return a JSON object with a single key 'tagIds' which is an array of strings, where each string is the ID of a suggested tag. Only suggest tags from the provided list that are not already selected.`;
        
        const userPrompt = `Selected Tags: ${JSON.stringify(selectedInCategory.map(t => ({id: t.id, label: t.label})))}. Available Tags for suggestion: ${JSON.stringify(category.tags.map(({id, label, description}) => ({id, label, description})))}.`;
        
        try {
            const result = await callLlm(systemPrompt, userPrompt);
            if (result && Array.isArray(result.tagIds)) {
                const newTags = result.tagIds
                    .map((id: string) => taxonomyMap.get(id))
                    .filter((t): t is Tag => !!t && !selectedTags[t.id]);
                setSuggestedTags(newTags);
            } else {
                throw new Error("AI returned an invalid response format.");
            }
        } catch (e: any) {
            setSuggestionError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [category, selectedTags, taxonomyMap, callLlm]);

    const handleGenerateLyrics = useCallback(async () => {
        setIsLoadingLyrics(true);
        setLyricError(null);
        setLyricIdeas([]);

        const relevantTags = Object.values(selectedTags).filter(t => ['genre', 'mood'].includes(t.categoryId));

        const systemPrompt = `You are a creative songwriter AI. Your task is to generate lyrical theme ideas. The user will provide a list of music style tags. You must generate 3 short, distinct lyrical themes (e.g., 'a story about a lost robot in a neon city', 'the feeling of a fading summer memory'). Return a JSON object with a single key 'themes' which is an array of strings.`;
        const userPrompt = `Music Styles: ${JSON.stringify(relevantTags.map(t => t.label))}.`;

        try {
            const result = await callLlm(systemPrompt, userPrompt);
            if (result && Array.isArray(result.themes)) {
                setLyricIdeas(result.themes);
            } else {
                 throw new Error("AI returned an invalid response format.");
            }
        } catch (e: any) {
            setLyricError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoadingLyrics(false);
        }

    }, [selectedTags, callLlm]);
    
    const handleLyricIdeaClick = (idea: string) => {
        onSetLyricText(idea);
        setLyricIdeas([]);
    }

    if (category.type === 'text') {
        if (category.id !== 'lyrics') return null;
        return (
            <div>
                <h3 className="text-base font-semibold mb-4 text-bunker-600 dark:text-bunker-300">AI Lyric Helper</h3>
                 <button onClick={handleGenerateLyrics} disabled={isLoadingLyrics} className="flex items-center space-x-2 text-sm px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors disabled:opacity-50">
                    {isLoadingLyrics ? <LoadingSpinner /> : <Icon name="wandSparkles" className="w-4 h-4" />}
                    <span>Generate Lyric Ideas</span>
                </button>
                {lyricError && <p className="text-red-500 text-xs mt-2">{lyricError}</p>}
                {lyricIdeas.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {lyricIdeas.map((idea, i) => (
                            <button key={i} onClick={() => handleLyricIdeaClick(idea)} className="block w-full text-left p-2 bg-bunker-100 dark:bg-bunker-800 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700 text-sm">
                                "{idea}"
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div>
            <h3 className="text-base font-semibold mb-4 text-bunker-600 dark:text-bunker-300">AI Features</h3>
            <button onClick={handleSuggestTags} disabled={isLoadingSuggestions} className="flex items-center space-x-2 text-sm px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors disabled:opacity-50">
                {isLoadingSuggestions ? <LoadingSpinner /> : <Icon name="wandSparkles" className="w-4 h-4" />}
                <span>Suggest Complementary Tags</span>
            </button>
            {suggestionError && <p className="text-red-500 text-xs mt-2">{suggestionError}</p>}
            {suggestedTags.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-bunker-500 dark:text-bunker-400">AI Suggestions:</h4>
                    <div className="flex flex-wrap gap-3">
                        {suggestedTags.map((tag) => (
                            <TagChip
                                key={tag.id}
                                tag={tag}
                                isSelected={!!selectedTags[tag.id]}
                                onToggle={onToggleTag}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
