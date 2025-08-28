
import React, { useState } from 'react';
import type { Preset, Macro } from '../types';
import { Icon } from './icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  presets: Preset[];
  macros: Macro[];
  onToggleTheme: () => void;
  onLoadPreset: (preset: Preset) => void;
  onApplyMacro: (macro: Macro) => void;
  onSavePreset: () => void;
  onRandomize: () => void;
  onClear: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, presets, macros, onToggleTheme, onLoadPreset, onApplyMacro, onSavePreset, onRandomize, onClear }) => {
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isMacroDropdownOpen, setIsMacroDropdownOpen] = useState(false);

  return (
    <header className="bg-bunker-50 dark:bg-bunker-900 text-bunker-900 dark:text-white p-3 flex items-center justify-between border-b border-bunker-200 dark:border-bunker-800 shadow-md shrink-0">
      <h1 className="text-xl font-bold">UDIO Prompt Crafter</h1>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setIsMacroDropdownOpen(!isMacroDropdownOpen)}
            className="px-4 py-2 bg-bunker-100 dark:bg-bunker-800 text-sm rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700 flex items-center"
          >
            <Icon name="wandSparkles" className="w-4 h-4 mr-2" /> Macros <Icon name="chevronDown" className="w-4 h-4 ml-2" />
          </button>
          {isMacroDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-bunker-800 rounded-md shadow-lg z-20 border border-bunker-200 dark:border-bunker-700">
              <ul>
                {macros.map((macro) => (
                  <li key={macro.name}>
                    <button
                      onClick={() => {
                        onApplyMacro(macro);
                        setIsMacroDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-bunker-800 dark:text-bunker-200 hover:bg-blue-600 hover:text-white"
                      title={macro.description}
                    >
                      {macro.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
         <div className="relative">
          <button
            onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
            className="px-4 py-2 bg-bunker-100 dark:bg-bunker-800 text-sm rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700 flex items-center"
          >
            Presets <Icon name="chevronDown" className="w-4 h-4 ml-2" />
          </button>
          {isPresetDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-bunker-800 rounded-md shadow-lg z-20 border border-bunker-200 dark:border-bunker-700">
              <ul>
                {presets.map((preset) => (
                  <li key={preset.name}>
                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        setIsPresetDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-bunker-800 dark:text-bunker-200 hover:bg-blue-600 hover:text-white"
                    >
                      {preset.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button onClick={onSavePreset} className="px-3 py-2 bg-bunker-100 dark:bg-bunker-800 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Save Current as Preset">
          <Icon name="save" className="w-5 h-5" />
        </button>
        <button onClick={onRandomize} className="px-3 py-2 bg-bunker-100 dark:bg-bunker-800 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Randomize">
          <Icon name="sparkles" className="w-5 h-5" />
        </button>
        <button onClick={onClear} className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" title="Clear All">
          <Icon name="trash" className="w-5 h-5" />
        </button>
        <button onClick={onToggleTheme} className="px-3 py-2 bg-bunker-100 dark:bg-bunker-800 rounded-md hover:bg-bunker-200 dark:hover:bg-bunker-700">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
