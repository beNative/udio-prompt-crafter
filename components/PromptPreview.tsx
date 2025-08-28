import React, { useState, useEffect } from 'react';
import type { SelectedTag, Conflict, UDIOParams } from '../types';
import { Icon } from './icons';
import { normalizeTagLabels } from '../utils/normalization';
import { UDIOParamsEditor } from './UDIOParams';

interface PromptPreviewProps {
  orderedCategories: { id: string, name: string, type?: 'tags' | 'text' }[];
  selectedTags: Record<string, SelectedTag>;
  textCategoryValues: Record<string, string>;
  conflicts: Conflict[];
  udioParams: UDIOParams;
  onUDIOParamsChange: (params: UDIOParams) => void;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 bg-bunker-200 dark:bg-bunker-700 rounded-md hover:bg-bunker-300 dark:hover:bg-bunker-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Icon name="check" className="w-4 h-4 text-green-400" /> : <Icon name="copy" className="w-4 h-4 text-bunker-500 dark:text-bunker-300" />}
    </button>
  );
};

export const PromptPreview: React.FC<PromptPreviewProps> = ({ orderedCategories, selectedTags, textCategoryValues, conflicts, udioParams, onUDIOParamsChange }) => {
  const [prompt, setPrompt] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [activeTab, setActiveTab] = useState('prompt');

  useEffect(() => {
    const sortedTags = orderedCategories.flatMap(category => 
      Object.values(selectedTags).filter(tag => tag.categoryId === category.id)
    );

    const tagLabels = sortedTags.map(tag => tag.label);
    const normalizedLabels = normalizeTagLabels(tagLabels);

    const textInputs = orderedCategories
        .filter(cat => cat.type === 'text' && textCategoryValues[cat.id])
        .map(cat => textCategoryValues[cat.id]);

    const allPromptParts = [...normalizedLabels, ...textInputs];
    const promptString = allPromptParts.join('; ');
    
    setPrompt(promptString);

    const json = {
      prompt: promptString,
      udio_params: udioParams,
      tags: sortedTags.map(({ id, label, categoryId }) => ({ id, label, categoryId })),
      text_inputs: textCategoryValues,
      category_order: orderedCategories.map(c => c.id),
    };
    setJsonOutput(JSON.stringify(json, null, 2));
  }, [selectedTags, orderedCategories, textCategoryValues, udioParams]);

  return (
    <div className="p-4 bg-bunker-50 dark:bg-bunker-900 text-bunker-500 dark:text-bunker-300 h-full flex flex-col">
      <div className="flex-grow flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 text-bunker-900 dark:text-white">Live Preview</h2>
        
        {conflicts.length > 0 && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md mb-4 shrink-0">
              <h3 className="font-bold flex items-center"><Icon name="warning" className="w-5 h-5 mr-2" /> Conflicts Detected</h3>
              <ul className="text-sm mt-2 list-disc list-inside">
                  {conflicts.map((c) => <li key={`${c.tagA.id}-${c.tagB.id}`}>"{c.tagA.label}" conflicts with "{c.tagB.label}"</li>)}
              </ul>
          </div>
        )}
        
        <div className="flex border-b border-bunker-200 dark:border-bunker-700 mb-4 shrink-0">
          <button onClick={() => setActiveTab('prompt')} className={`px-4 py-2 text-sm ${activeTab === 'prompt' ? 'text-bunker-900 dark:text-white border-b-2 border-blue-500' : 'text-bunker-500 dark:text-bunker-400'}`}>Prompt String</button>
          <button onClick={() => setActiveTab('json')} className={`px-4 py-2 text-sm ${activeTab === 'json' ? 'text-bunker-900 dark:text-white border-b-2 border-blue-500' : 'text-bunker-500 dark:text-bunker-400'}`}>JSON Output</button>
        </div>
        
        <div className="flex-grow relative min-h-0">
          {activeTab === 'prompt' ? (
            <div className="relative h-full">
              <textarea
                readOnly
                value={prompt}
                className="w-full h-full p-3 bg-white dark:bg-bunker-950 rounded-md text-bunker-800 dark:text-bunker-200 resize-none font-mono text-sm border border-bunker-200 dark:border-bunker-800"
                placeholder="Your generated prompt will appear here..."
              />
              <CopyButton textToCopy={prompt} />
            </div>
          ) : (
            <div className="relative h-full">
              <textarea
                readOnly
                value={jsonOutput}
                className="w-full h-full p-3 bg-white dark:bg-bunker-950 rounded-md text-bunker-800 dark:text-bunker-200 resize-none font-mono text-sm border border-bunker-200 dark:border-bunker-800"
              />
              <CopyButton textToCopy={jsonOutput} />
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 mt-4">
        <UDIOParamsEditor params={udioParams} onChange={onUDIOParamsChange} />
      </div>
    </div>
  );
};
