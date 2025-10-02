
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLogger } from '../hooks/useLogger';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { logger } from '../utils/logger';
import type { LogLevel, LogEntry } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface LogPanelProps {
  onClose: () => void;
}

const levelStyles: Record<LogLevel, { text: string; bg: string; border: string; }> = {
  DEBUG:   { text: 'text-green-600 dark:text-green-400',   bg: 'bg-green-100 dark:bg-green-900/40',   border: 'border-green-300 dark:border-green-600/50' },
  INFO:    { text: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-100 dark:bg-blue-900/40',      border: 'border-blue-300 dark:border-blue-600/50' },
  WARNING: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-300 dark:border-orange-600/50' },
  ERROR:   { text: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/40',       border: 'border-red-300 dark:border-red-600/50' },
};

const allLevels: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];

export const LogPanel: React.FC<LogPanelProps> = ({ onClose }) => {
  const [logs, setLogs] = useLogger();
  const [enabledLevels, setEnabledLevels] = useLocalStorage<LogLevel[]>('log-filters', ['INFO', 'WARNING', 'ERROR']);
  const [logToFile, setLogToFile] = useLocalStorage('log-to-file', false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isElectron = !!window.electronAPI;

  useEffect(() => {
    logger.setLogToFile(logToFile);
  }, [logToFile]);

  useEffect(() => {
    // Auto-scroll to the bottom when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleLevel = (level: LogLevel) => {
    setEnabledLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => enabledLevels.includes(log.level));
  }, [logs, enabledLevels]);

  const handleClear = () => {
      setLogs([]);
      logger.info('Log view cleared.');
  }

  const handleOpenLocation = () => {
      if (isElectron) {
          window.electronAPI.showLogInFolder();
      }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-bunker-950 text-bunker-800 dark:text-bunker-200">
      <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-bunker-200 dark:border-bunker-800">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-bunker-500 dark:text-bunker-400 px-2">Logs</h3>
          <div className="flex items-center space-x-1">
            {allLevels.map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md border transition-colors ${
                  enabledLevels.includes(level)
                    ? `${levelStyles[level].bg} ${levelStyles[level].text} ${levelStyles[level].border}`
                    : 'bg-transparent border-transparent text-bunker-400 hover:bg-bunker-100 dark:hover:bg-bunker-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isElectron && (
            <>
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-bunker-600 dark:text-bunker-300">
                    <input type="checkbox" checked={logToFile} onChange={e => setLogToFile(e.target.checked)} className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500" />
                    <span>Log to File</span>
                </label>
                <Tooltip text="Open log location">
                  <button
                    onClick={handleOpenLocation}
                    className="flex items-center space-x-1 text-sm px-2 py-1 rounded-md bg-bunker-100 dark:bg-bunker-800 hover:bg-bunker-200 dark:hover:bg-bunker-700"
                    aria-label="Open log location"
                  >
                    <Icon name="folder" className="w-4 h-4" />
                  </button>
                </Tooltip>
            </>
          )}
          <Tooltip text="Clear logs">
            <button
              onClick={handleClear}
              className="flex items-center space-x-1 text-sm px-2 py-1 rounded-md bg-bunker-100 dark:bg-bunker-800 hover:bg-bunker-200 dark:hover:bg-bunker-700"
              aria-label="Clear logs"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text="Close panel">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800"
              aria-label="Close panel"
            >
              <Icon name="x" className="w-5 h-5 text-bunker-500" />
            </button>
          </Tooltip>
        </div>
      </header>
      <div ref={logContainerRef} className="flex-grow p-2 overflow-y-auto font-mono text-xs">
        {filteredLogs.map((log, i) => {
          const d = new Date(log.timestamp);
          const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
          return (
          <div key={i} className={`flex items-start p-1 rounded hover:bg-bunker-50 dark:hover:bg-bunker-900 ${levelStyles[log.level].text}`}>
            <span className="flex-shrink-0 w-48 text-bunker-400 dark:text-bunker-500 pr-2">{time}</span>
            <span className={`flex-shrink-0 font-bold w-20`}>[{log.level}]</span>
            <span className="flex-grow whitespace-pre-wrap break-words">{log.message} {log.context && JSON.stringify(log.context, null, 2)}</span>
          </div>
        );
        })}
      </div>
    </div>
  );
};