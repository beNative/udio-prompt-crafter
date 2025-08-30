
import React, { useState, useCallback } from 'react';
import type { Category, SelectedTag } from '../types';
import { Icon } from './icons';

interface AiFeaturesProps {
    category: Category;
    selectedTags: Record<string, SelectedTag>;
    callLlm: (systemPrompt: string, userPrompt: string, isResponseTextFreeform?: boolean) => Promise<any>;
    lyricKeywords: string;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-bunker-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const AiFeatures: React.FC<AiFeaturesProps> = ({ category, selectedTags, callLlm, lyricKeywords }) => {
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [lyricError, setLyricError] = useState<string | null>(null);
    const [lyricIdeas, setLyricIdeas] = useState<string[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    
    const handleGenerateLyrics = useCallback(async () => {
        setIsLoadingLyrics(true);
        setLyricError(null);
        setLyricIdeas([]);

        const relevantTags = Object.values(selectedTags).filter(t => ['genre', 'mood'].includes(t.categoryId));

        const systemPrompt = `You are a creative songwriter AI. Your task is to generate 3 short, distinct lyrical theme ideas in English, based on a list of music style tags and user-provided keywords.

- Your response MUST be a valid JSON object.
- The JSON object must have a single key: "themes".
- The value of "themes" must be an array of 3 strings.
- Each string in the array should be a unique lyrical theme.
- Do NOT include any text, explanations, or markdown formatting outside of the JSON object itself.

Here is a perfect example of the required response format:
{
  "themes": [
    "a story about a lost robot in a neon city",
    "the feeling of a fading summer memory",
    "a secret whispered on a midnight train"
  ]
}`;
        const userPromptParts = [];
        if (relevantTags.length > 0) {
            userPromptParts.push(`Music Styles: ${JSON.stringify(relevantTags.map(t => t.label))}.`);
        }
        if (lyricKeywords) {
            userPromptParts.push(`Keywords: "${lyricKeywords}".`);
        }

        if (userPromptParts.length === 0) {
            setLyricError("Please provide some keywords or select some genre/mood tags to generate ideas.");
            setIsLoadingLyrics(false);
            return;
        }

        const userPrompt = userPromptParts.join('\n');

        try {
            const result = await callLlm(systemPrompt, userPrompt);
            if (result && Array.isArray(result.themes)) {
                setLyricIdeas(result.themes);
            } else {
                 console.error("AI returned an invalid response format for lyric generation. Response:", result);
                 throw new Error("AI returned an invalid response format.");
            }
        } catch (e: any) {
            setLyricError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoadingLyrics(false);
        }

    }, [selectedTags, callLlm, lyricKeywords]);
    
    const handleCopyLyric = (idea: string, index: number) => {
        navigator.clipboard.writeText(idea).then(() => {
            setCopiedIndex(index);
            setTimeout(() => {
                setCopiedIndex(null);
            }, 2000);
        });
    };

    if (category.id !== 'lyrics') {
        return null;
    }

    const hasInput = lyricKeywords.trim().length > 0 || Object.values(selectedTags).some(t => ['genre', 'mood'].includes(t.categoryId));
    
    return (
        <div>
            <h3 className="text-base font-semibold mb-4 text-bunker-600 dark:text-bunker-300">AI Lyric Helper</h3>
            <button 
                onClick={handleGenerateLyrics} 
                disabled={isLoadingLyrics || !hasInput}
                className="flex items-center space-x-2 text-sm px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingLyrics ? <LoadingSpinner /> : <Icon name="wandSparkles" className="w-4 h-4" />}
                <span>Generate Lyric Ideas</span>
            </button>
            {lyricError && <p className="text-red-500 text-xs mt-2">{lyricError}</p>}
            {lyricIdeas.length > 0 && (
                <div className="mt-4 space-y-2">
                    {lyricIdeas.map((idea, i) => (
                        <div key={i} className="flex items-center justify-between p-2 pl-3 bg-bunker-100 dark:bg-bunker-800 rounded-md text-sm">
                            <span className="flex-grow pr-2 text-bunker-800 dark:text-bunker-200">"{idea}"</span>
                            <button 
                                onClick={() => handleCopyLyric(idea, i)} 
                                className="p-1.5 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700 transition-colors flex-shrink-0"
                                title="Copy to clipboard"
                            >
                                {copiedIndex === i ? (
                                    <Icon name="check" className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Icon name="copy" className="w-4 h-4 text-bunker-500 dark:text-bunker-400" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
