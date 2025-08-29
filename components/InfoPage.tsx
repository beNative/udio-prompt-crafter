import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { MarkdownViewer } from './MarkdownViewer';

const isElectron = !!window.electronAPI;

const DOCS = [
  { id: 'readme', title: 'Readme', file: 'README_APP.md' },
  { id: 'functional', title: 'Functional Manual', file: 'MANUAL_FUNCTIONAL.md' },
  { id: 'technical', title: 'Technical Manual', file: 'MANUAL_TECHNICAL.md' },
  { id: 'changelog', title: 'Version Log', file: 'CHANGELOG.md' },
];

export const InfoPage: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState(DOCS[0]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let text = '';
        if (isElectron) {
          text = await window.electronAPI.readMarkdownFile(activeDoc.file);
        } else {
          const response = await fetch(`./docs/${activeDoc.file}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.statusText}`);
          }
          text = await response.text();
        }
        setContent(text);
      } catch (e: any) {
        const errorMessage = `Could not load document: ${activeDoc.title}`;
        logger.error(errorMessage, { error: e.message });
        setError(errorMessage);
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [activeDoc]);
  
  const navButtonStyles = "px-4 py-2 text-sm font-medium rounded-lg transition-colors";
  const activeNavStyles = "bg-blue-600 text-white shadow-sm";
  const inactiveNavStyles = "text-bunker-600 dark:text-bunker-300 hover:bg-bunker-100 dark:hover:bg-bunker-800";

  return (
    <div className="flex h-full bg-white dark:bg-bunker-900">
      <nav className="w-64 border-r border-bunker-200 dark:border-bunker-800 p-4 shrink-0 bg-bunker-50/50 dark:bg-bunker-900/50">
        <h2 className="text-lg font-semibold mb-4 text-bunker-900 dark:text-white px-2">Information</h2>
        <ul className="space-y-1">
          {DOCS.map(doc => (
            <li key={doc.id}>
              <button
                onClick={() => setActiveDoc(doc)}
                className={`w-full text-left ${navButtonStyles} ${activeDoc.id === doc.id ? activeNavStyles : inactiveNavStyles}`}
              >
                {doc.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-grow p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-bunker-500">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Document...
          </div>
        ) : error ? (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
            </div>
        ) : (
          <MarkdownViewer content={content} />
        )}
      </main>
    </div>
  );
};