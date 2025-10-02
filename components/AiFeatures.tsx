

import React, { useState, useCallback } from 'react';
import type { Category, SelectedTag } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface AiFeaturesProps {
    category: Category;
    selectedTags: Record<string, SelectedTag>;
    callLlm: (systemPrompt: string, userPrompt: string, isResponseTextFreeform?: boolean) => Promise<any>;
    lyricKeywords: string;
}

const LoadingSpinner: React.FC<{className?: string}> = ({className = 'h-5 w-5'}) => (
    <svg className={`animate-spin text-bunker-400 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const AiFeatures: React.FC<AiFeaturesProps> = ({ category, selectedTags, callLlm, lyricKeywords }) => {
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [ideaError, setIdeaError] = useState<string | null>(null);
    const [lyricIdeas, setLyricIdeas] = useState<string[]>([]);
    const [copiedIdeaIndex, setCopiedIdeaIndex] = useState<number | null>(null);

    const [isGeneratingFullLyrics, setIsGeneratingFullLyrics] = useState(false);
    const [fullLyricsError, setFullLyricsError] = useState<string | null>(null);
    const [generatedLyrics, setGeneratedLyrics] = useState('');
    const [copiedLyrics, setCopiedLyrics] = useState(false);
    
    // FIX: Cast t to SelectedTag to access categoryId.
    const relevantTags = Object.values(selectedTags).filter(t => ['genre', 'mood'].includes((t as SelectedTag).categoryId));

    const handleGenerateIdeas = useCallback(async () => {
        setIsLoadingIdeas(true);
        setIdeaError(null);
        setLyricIdeas([]);
        setGeneratedLyrics('');
        setFullLyricsError(null);

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
            // FIX: Cast t to SelectedTag to access label.
            userPromptParts.push(`Music Styles: ${JSON.stringify(relevantTags.map(t => (t as SelectedTag).label))}.`);
        }
        if (lyricKeywords) {
            userPromptParts.push(`Keywords: "${lyricKeywords}".`);
        }

        if (userPromptParts.length === 0) {
            setIdeaError("Please provide some keywords or select some genre/mood tags to generate ideas.");
            setIsLoadingIdeas(false);
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
            setIdeaError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoadingIdeas(false);
        }

    }, [relevantTags, callLlm, lyricKeywords]);

    const handleGenerateFullLyrics = useCallback(async (themeIdea: string) => {
        setIsGeneratingFullLyrics(true);
        setFullLyricsError(null);
        setGeneratedLyrics('');

        const systemPrompt = `You are an expert songwriter AI. Your task is to write a complete song with lyrics based on a given theme. The song should have a conventional structure (e.g., Verse, Chorus, Bridge). Use the provided music style tags to influence the tone and style of the lyrics. Your output should be a single block of text containing the full lyrics, formatted clearly with structure labels like [Verse 1], [Chorus], etc.`;
        
        const userPromptParts = [`Theme: "${themeIdea}"`];
         if (relevantTags.length > 0) {
            // FIX: Cast t to SelectedTag to access label.
            userPromptParts.push(`Music Styles: ${JSON.stringify(relevantTags.map(t => (t as SelectedTag).label))}.`);
        }
        
        const userPrompt = userPromptParts.join('\n\n');

        try {
            const result = await callLlm(systemPrompt, userPrompt, true);
            if (typeof result === 'string') {
                setGeneratedLyrics(result.trim());
            } else {
                throw new Error("Received an unexpected response format from the AI.");
            }
        } catch (e: any) {
            setFullLyricsError(e.message || "An unknown error occurred.");
        } finally {
            setIsGeneratingFullLyrics(false);
        }
    }, [relevantTags, callLlm]);
    
    const handleCopy = (text: string, type: 'idea' | 'full', index?: number) => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'idea' && index !== undefined) {
                setCopiedIdeaIndex(index);
                setTimeout(() => setCopiedIdeaIndex(null), 2000);
            } else if (type === 'full') {
                setCopiedLyrics(true);
                setTimeout(() => setCopiedLyrics(false), 2000);
            }
        });
    };

    if (category.id !== 'lyrics') {
        return null;
    }

    const hasInput = lyricKeywords.trim().length > 0 || relevantTags.length > 0;
    
    return (
        <div>
            <h3 className="text-base font-semibold mb-4 text-bunker-600 dark:text-bunker-300">AI Lyric Helper</h3>
            <button 
                onClick={handleGenerateIdeas} 
                disabled={isLoadingIdeas || !hasInput}
                className="flex items-center space-x-2 text-sm px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingIdeas ? <LoadingSpinner className="w-4 h-4"/> : <Icon name="wandSparkles" className="w-4 h-4" />}
                <span>Generate Lyric Ideas</span>
            </button>
            {ideaError && <p className="text-red-500 text-xs mt-2">{ideaError}</p>}
            {lyricIdeas.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs text-bunker-500 dark:text-bunker-400">Step 1: Choose a theme to expand.</p>
                    {lyricIdeas.map((idea, i) => (
                        <div key={i} className="flex items-center justify-between p-2 pl-3 bg-bunker-100 dark:bg-bunker-800 rounded-md text-sm">
                            <span className="flex-grow pr-2 text-bunker-800 dark:text-bunker-200">"{idea}"</span>
                            <div className="flex-shrink-0 flex items-center space-x-1">
                                <button
                                    onClick={() => handleGenerateFullLyrics(idea)}
                                    disabled={isGeneratingFullLyrics}
                                    className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                                >
                                    Generate Lyrics
                                </button>
                                <Tooltip text={copiedIdeaIndex === i ? 'Copied!' : 'Copy idea to clipboard'}>
                                    <button
                                        onClick={() => handleCopy(idea, 'idea', i)}
                                        className="p-1.5 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700 transition-colors"
                                        aria-label="Copy idea to clipboard"
                                    >
                                        {copiedIdeaIndex === i ? (
                                            <Icon name="check" className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Icon name="copy" className="w-4 h-4 text-bunker-500 dark:text-bunker-400" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(isGeneratingFullLyrics || fullLyricsError || generatedLyrics) && (
                <div className="mt-6 pt-4 border-t border-bunker-200 dark:border-bunker-700">
                    <h4 className="text-sm font-semibold mb-2 text-bunker-600 dark:text-bunker-300">Generated Lyrics</h4>
                    {isGeneratingFullLyrics && (
                         <div className="flex items-center justify-center h-48 bg-bunker-100 dark:bg-bunker-800/50 rounded-lg">
                            <LoadingSpinner />
                            <span className="ml-2 text-bunker-500">Generating...</span>
                        </div>
                    )}
                    {fullLyricsError && <p className="text-red-500 text-xs mt-2">{fullLyricsError}</p>}
                    {generatedLyrics && (
                        <div className="relative">
                            <textarea
                                readOnly
                                value={generatedLyrics}
                                className="w-full h-64 p-3 bg-white dark:bg-bunker-900 border border-bunker-200 dark:border-bunker-700 rounded-lg text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-xs"
                            />
                             <Tooltip text={copiedLyrics ? 'Copied!' : 'Copy lyrics to clipboard'}>
                                <button
                                    onClick={() => handleCopy(generatedLyrics, 'full')}
                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-bunker-100 hover:bg-bunker-200 dark:bg-bunker-800 dark:hover:bg-bunker-700 transition-colors"
                                    aria-label="Copy lyrics to clipboard"
                                >
                                    {copiedLyrics ? (
                                        <Icon name="check" className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Icon name="copy" className="w-4 h-4 text-bunker-500 dark:text-bunker-400" />
                                    )}
                                </button>
                             </Tooltip>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};