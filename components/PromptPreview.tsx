import React, { useState, useEffect } from 'react';
import type { SelectedTag, Conflict } from '../types';
import { Icon } from './icons';
import { normalizeTagLabels } from '../utils/normalization';

interface PromptPreviewProps {
  orderedCategories: { id: string, name: string, type?: 'tags' | 'text' }[];
  selectedTags: Record<string, SelectedTag>;
  textCategoryValues: Record<string, string>;
  conflicts: Conflict[];
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
      className="absolute top-3 right-3 p-1.5 bg-bunker-200/50 dark:bg-bunker-700/50 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Icon name="check" className="w-5 h-5 text-green-500" /> : <Icon name="copy" className="w-5 h-5 text-bunker-500 dark:text-bunker-300" />}
    </button>
  );
};

const JsonSyntaxHighlighter: React.FC<{ jsonString: string }> = ({ jsonString }) => {
  const highlight = (json: string) => {
    if (!json) return { __html: '' };
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
    return { __html: highlighted };
  };

  return (
    <pre className="w-full h-full p-4 bg-bunker-50 dark:bg-bunker-900 rounded-lg text-bunker-800 dark:text-bunker-200 font-mono text-sm border border-bunker-200 dark:border-bunker-800 overflow-auto">
      <code dangerouslySetInnerHTML={highlight(jsonString)} />
    </pre>
  );
};

export const PromptPreview: React.FC<PromptPreviewProps> = ({ orderedCategories, selectedTags, textCategoryValues, conflicts }) => {
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
    const promptString = allPromptParts.join(', ');
    
    setPrompt(promptString);

    const json = {
      prompt: promptString,
      tags: sortedTags.map(({ id, label, categoryId }) => ({ id, label, categoryId })),
      text_inputs: textCategoryValues,
      category_order: orderedCategories.map(c => c.id),
    };
    setJsonOutput(JSON.stringify(json, null, 2));
  }, [selectedTags, orderedCategories, textCategoryValues]);

  return (
    <div className="p-4 bg-bunker-50/50 dark:bg-bunker-900/50 text-bunker-500 dark:text-bunker-300 h-full flex flex-col">
      <div className="flex-grow flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 px-2 text-bunker-900 dark:text-white">Live Preview</h2>
        
        {conflicts.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 shrink-0">
              <h3 className="font-bold flex items-center"><Icon name="warning" className="w-5 h-5 mr-2 text-red-500" /> Conflicts Detected</h3>
              <ul className="text-sm mt-2 list-disc list-inside ml-2">
                  {conflicts.map((c) => <li key={`${c.tagA.id}-${c.tagB.id}`}>"<span className="font-semibold">{c.tagA.label}</span>" conflicts with "<span className="font-semibold">{c.tagB.label}</span>"</li>)}
              </ul>
          </div>
        )}
        
        <div className="flex border-b border-bunker-200 dark:border-bunker-800 mb-4 shrink-0">
          <button onClick={() => setActiveTab('prompt')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'prompt' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-bunker-500 dark:text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800/50'}`}>Prompt String</button>
          <button onClick={() => setActiveTab('json')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'json' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-bunker-500 dark:text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800/50'}`}>JSON Output</button>
        </div>
        
        <div className="flex-grow relative min-h-0">
          {activeTab === 'prompt' ? (
            <div className="relative h-full">
              <textarea
                readOnly
                value={prompt}
                className="w-full h-full p-4 bg-bunker-50 dark:bg-bunker-900 rounded-lg text-bunker-800 dark:text-bunker-200 resize-none font-mono text-sm border border-bunker-200 dark:border-bunker-800"
                placeholder="Your generated prompt will appear here..."
              />
              <CopyButton textToCopy={prompt} />
            </div>
          ) : (
            <div className="relative h-full">
              <JsonSyntaxHighlighter jsonString={jsonOutput} />
              <CopyButton textToCopy={jsonOutput} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};