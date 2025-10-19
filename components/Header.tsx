import React from 'react';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  theme: 'light' | 'dark';
  activeView: 'crafter' | 'settings' | 'info' | 'presets';
  onSetView: (view: 'crafter' | 'settings' | 'info' | 'presets') => void;
  onToggleTheme: () => void;
  onOpenSavePresetModal: () => void;
  onSaveActivePresetAsNew: () => void;
  onUpdateActivePreset: () => void;
  onOpenHistoryModal: () => void;
  onOpenDeconstructModal: () => void;
  onOpenThematicRandomizerModal: () => void;
  onClear: () => void;
  onOpenCommandPalette: () => void;
  onToggleLogPanel: () => void;
  activePreset: { name: string; isDirty: boolean } | null;
}

const HeaderButton: React.FC<{onClick: () => void; title: string; icon: string; children?: React.ReactNode; className?: string;}> = ({onClick, title, icon, children, className=""}) => (
    <Tooltip text={title}>
        <button 
            onClick={onClick} 
            className={`px-3 py-2 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 hover:text-bunker-800 dark:hover:bg-bunker-700/80 dark:hover:text-white transition-colors ${className}`}
            aria-label={title}
        >
          {children || <Icon name={icon} className="w-5 h-5" />}
        </button>
    </Tooltip>
);

export const Header: React.FC<HeaderProps> = ({
    theme,
    activeView,
    onSetView,
    onToggleTheme,
    onOpenSavePresetModal,
    onSaveActivePresetAsNew,
    onUpdateActivePreset,
    onOpenHistoryModal,
    onOpenDeconstructModal,
    onOpenThematicRandomizerModal,
    onClear,
    onOpenCommandPalette,
    onToggleLogPanel,
    activePreset
}) => {

  const tabButtonStyles = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors";
  const activeTabStyles = "bg-blue-600 text-white shadow-sm";
  const inactiveTabStyles = "text-bunker-500 dark:text-bunker-400 hover:bg-white/60 dark:hover:bg-bunker-700/50";
  const presetHighlightClasses = activePreset
    ? activePreset.isDirty
      ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/40 dark:text-amber-200'
      : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400/40 dark:text-blue-200'
    : '';

  return (
    <header className="bg-white/80 dark:bg-bunker-950/80 backdrop-blur-sm text-bunker-900 dark:text-white p-3 flex items-center justify-between border-b border-bunker-200/80 dark:border-bunker-800/80 shrink-0">
      <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-1 p-1 bg-bunker-100 dark:bg-bunker-800/80 rounded-lg">
              <button onClick={() => onSetView('crafter')} className={`${tabButtonStyles} ${activeView === 'crafter' ? activeTabStyles : inactiveTabStyles}`}>
                  Crafter
              </button>
              <button onClick={() => onSetView('presets')} className={`${tabButtonStyles} ${activeView === 'presets' ? activeTabStyles : inactiveTabStyles}`}>
                  Presets
              </button>
              <button onClick={() => onSetView('settings')} className={`${tabButtonStyles} ${activeView === 'settings' ? activeTabStyles : inactiveTabStyles}`}>
                  Settings
              </button>
              <button onClick={() => onSetView('info')} className={`${tabButtonStyles} ${activeView === 'info' ? activeTabStyles : inactiveTabStyles}`}>
                  Info
              </button>
          </nav>
          {activePreset && (
            <div
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border ${presetHighlightClasses} flex-wrap sm:flex-nowrap`}
            >
              <Icon name="bookmark" className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide opacity-80">Active Preset</p>
                <span className="block text-xs sm:text-sm font-medium truncate max-w-[10rem] sm:max-w-[12rem]" title={activePreset.name}>
                  {activePreset.name}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${activePreset.isDirty ? 'text-amber-600 dark:text-amber-200' : 'text-blue-600 dark:text-blue-200'}`}>
                  {activePreset.isDirty ? 'Modified' : 'In Sync'}
                </span>
                {activePreset.isDirty && (
                  <Tooltip text="Update this preset with your current settings">
                    <button
                      onClick={onUpdateActivePreset}
                      className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-amber-400 transition-colors"
                    >
                      Update
                    </button>
                  </Tooltip>
                )}
                <Tooltip text="Save these settings as a brand new preset">
                  <button
                    onClick={onSaveActivePresetAsNew}
                    className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-bunker-900 focus:ring-blue-400 transition-colors"
                  >
                    Save as New
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
      </div>

      <div className="flex items-center space-x-2">
        {activeView === 'crafter' && (
            <>
                <HeaderButton onClick={onOpenHistoryModal} title="Prompt History" icon="history" />
                <HeaderButton onClick={onOpenSavePresetModal} title="Save Current as Preset..." icon="save" />
                <HeaderButton onClick={onOpenDeconstructModal} title="Deconstruct Prompt with AI" icon="wandSparkles" />
                <HeaderButton onClick={onOpenThematicRandomizerModal} title="Thematic Randomizer" icon="sparkles" />
                <Tooltip text="Clear All">
                    <button onClick={onClear} className="px-3 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors" aria-label="Clear All">
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