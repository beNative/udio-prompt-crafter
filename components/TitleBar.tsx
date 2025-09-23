import React, { useState, useEffect } from 'react';
import { Icon } from './icons';

interface TitleBarProps {
  onOpenCommandPalette: () => void;
}

const isElectron = !!window.electronAPI;

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenCommandPalette }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appTitle, setAppTitle] = useState('UDIO Prompt Crafter');

  useEffect(() => {
    if (!isElectron) return;

    // Listen for window state changes from the main process
    const unsubscribe = window.electronAPI.onWindowStateChange((maximized) => {
      setIsMaximized(maximized);
    });
    return unsubscribe;
  }, []);

  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  if (!isElectron) {
    // Render nothing in a web environment
    return null;
  }
  
  return (
    <div className="title-bar h-10 bg-white/80 dark:bg-bunker-950/80 backdrop-blur-sm text-bunker-900 dark:text-white flex items-center justify-between border-b border-bunker-200/80 dark:border-bunker-800/80 shrink-0 select-none">
      <div className="flex items-center h-full px-4">
        {/* You could add an app icon here if you have one */}
        {/* <img src="..." className="w-5 h-5 mr-2" /> */}
        <span className="font-semibold text-sm">{appTitle}</span>
      </div>
      
      <div className="flex-grow flex items-center justify-center h-full">
         <div 
           className="no-drag w-full max-w-md h-8 flex items-center bg-bunker-100 dark:bg-bunker-800/80 rounded-md px-3 cursor-text text-bunker-400 hover:bg-bunker-200 dark:hover:bg-bunker-700/80 transition-colors"
           onClick={onOpenCommandPalette}
           title="Open Command Palette (Ctrl + ;)"
         >
            <Icon name="search" className="w-4 h-4 mr-2" />
            <span className="text-sm">Search tags and commands...</span>
            <kbd className="ml-auto text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded px-1.5 py-0.5">Ctrl</kbd>
            <span className="mx-0.5">+</span>
            <kbd className="text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded px-1.5 py-0.5">;</kbd>
         </div>
      </div>

      <div className="flex items-center h-full">
        <button onClick={handleMinimize} className="no-drag h-full w-12 flex items-center justify-center hover:bg-bunker-100 dark:hover:bg-bunker-800 transition-colors" aria-label="Minimize">
          <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12"><rect fill="currentColor" width="10" height="1" x="1" y="6"></rect></svg>
        </button>
        <button onClick={handleMaximize} className="no-drag h-full w-12 flex items-center justify-center hover:bg-bunker-100 dark:hover:bg-bunker-800 transition-colors" aria-label="Maximize">
          {isMaximized ? 
            <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="m2.5,1.5v7h7v-7h-7zm1,1h5v5h-5v-5z"></path><path fill="currentColor" d="m4.5,0.5v1h-3v8h8v-3h1v4h-10v-10h4z"></path></svg>
            : 
            <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12"><rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor"></rect></svg>
          }
        </button>
        <button onClick={handleClose} className="no-drag h-full w-12 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" aria-label="Close">
           <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12"><polygon fill="currentColor" fillRule="evenodd" points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"></polygon></svg>
        </button>
      </div>
    </div>
  );
};
