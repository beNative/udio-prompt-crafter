import React, { useState, useEffect, useRef } from 'react';
import type { Preset } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  theme: 'light' | 'dark';
  presets: Preset[];
  activeView: 'crafter' | 'settings' | 'info';
  onSetView: (view: 'crafter' | 'settings' | 'info') => void;
  onToggleTheme: () => void;
  onLoadPreset: (preset: Preset) => void;
  onSavePreset: () => void;
  onRandomize: () => void;
  onClear: () => void;
  onOpenCommandPalette: () => void;
  onToggleLogPanel: () => void;
}

const useClickOutside = (handler: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
  return ref;
};

const HeaderButton: React.FC<{onClick: () => void; title: string; icon: string; children?: React.ReactNode; className?: string;}> = ({onClick, title, icon, children, className=""}) => (
    <Tooltip text={title}>
        <button 
            onClick={onClick} 
            className={`px-3 py-2 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 hover:text-bunker-800 dark:hover:bg-bunker-700/80 dark:hover:text-white transition-colors ${className}`}
            title={title}
        >
          {children || <Icon name={icon} className="w-5 h-5" />}
        </button>
    </Tooltip>
);

export const Header: React.FC<HeaderProps> = ({ theme, presets, activeView, onSetView, onToggleTheme, onLoadPreset, onSavePreset, onRandomize, onClear, onOpenCommandPalette, onToggleLogPanel }) => {
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);

  const presetsDropdownRef = useClickOutside(() => setIsPresetDropdownOpen(false));
  
  const tabButtonStyles = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors";
  const activeTabStyles = "bg-blue-600 text-white shadow-sm";
  const inactiveTabStyles = "text-bunker-500 dark:text-bunker-400 hover:bg-white/60 dark:hover:bg-bunker-700/50";

  return (
    <header className="bg-white/80 dark:bg-bunker-950/80 backdrop-blur-sm text-bunker-900 dark:text-white p-3 flex items-center justify-between border-b border-bunker-200/80 dark:border-bunker-800/80 shrink-0 sticky top-0 z-30">
      <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold">UDIO Prompt Crafter</h1>
          <nav className="flex items-center space-x-1 p-1 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg">
              <button onClick={() => onSetView('crafter')} className={`${tabButtonStyles} ${activeView === 'crafter' ? activeTabStyles : inactiveTabStyles}`}>
                  Crafter
              </button>
              <button onClick={() => onSetView('settings')} className={`${tabButtonStyles} ${activeView === 'settings' ? activeTabStyles : inactiveTabStyles}`}>
                  Settings
              </button>
               <button onClick={() => onSetView('info')} className={`${tabButtonStyles} ${activeView === 'info' ? activeTabStyles : inactiveTabStyles}`}>
                  Info
              </button>
          </nav>
      </div>

      <div className="flex items-center space-x-2">
        {activeView === 'crafter' && (
            <>
                <Tooltip text={<>Open Command Palette <kbd className="ml-2 px-1.5 py-0.5 text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 text-xs font-sans border bg-bunker-200 dark:bg-bunker-600 border-bunker-300 dark:border-bunker-500 rounded">;</kbd></>}>
                  <button onClick={onOpenCommandPalette} className="px-3 py-2 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 hover:text-bunker-800 dark:hover:bg-bunker-700/80 dark:hover:text-white transition-colors">
                      <Icon name="search" className="w-5 h-5" />
                  </button>
                </Tooltip>
                
                 <div className="relative" ref={presetsDropdownRef}>
                  <button
                    onClick={() => setIsPresetDropdownOpen(prev => !prev)}
                    className="px-4 py-2 bg-bunker-100 dark:bg-bunker-800/80 text-sm font-medium rounded-lg text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 hover:text-bunker-800 dark:hover:bg-bunker-700/80 dark:hover:text-white transition-colors flex items-center"
                  >
                    Presets <Icon name="chevronDown" className="w-4 h-4 ml-2" />
                  </button>
                  {isPresetDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-bunker-800 rounded-lg shadow-lg z-20 border border-bunker-200 dark:border-bunker-700 overflow-hidden">
                      <ul>
                        {presets.map((preset) => (
                          <li key={preset.name}>
                            <button
                              onClick={() => {
                                onLoadPreset(preset);
                                setIsPresetDropdownOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-bunker-800 dark:text-bunker-200 hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              {preset.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <HeaderButton onClick={onSavePreset} title="Save Current as Preset" icon="save" />
                <HeaderButton onClick={onRandomize} title="Randomize" icon="sparkles" />
                <Tooltip text="Clear All">
                    <button onClick={onClear} className="px-3 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Clear All">
                      <Icon name="trash" className="w-5 h-5" />
                    </button>
                </Tooltip>
            </>
        )}
        <HeaderButton onClick={onToggleLogPanel} title="Toggle Logs" icon="terminal" />
        <HeaderButton onClick={onToggleTheme} title="Toggle Theme" icon={theme === 'dark' ? 'sun' : 'moon'} />
      </div>
    </header>
  );
};