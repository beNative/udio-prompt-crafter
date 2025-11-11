
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
  const copyOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const copyOptionsPanelRef = useRef<HTMLDivElement>(null);
  const isElectron = !!window.electronAPI;

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const dragAnchorRef = useRef<number | null>(null);
  const dragAdditiveRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const textSelectionRef = useRef(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copyOptions, setCopyOptions] = useState({
    includeTimestamp: true,
    includeLevel: true,
    includeContext: true,
    preserveLineBreaks: true,
  });

  useEffect(() => {
    logger.setLogToFile(logToFile);
  }, [logToFile]);

  useEffect(() => {
    // Auto-scroll to the bottom when new logs are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingSelection(false);
      dragAnchorRef.current = null;
      dragAdditiveRef.current = false;
      textSelectionRef.current = false;
      // allow normal click handling after drag completes
      setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!showCopyOptions) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        copyOptionsPanelRef.current &&
        !copyOptionsPanelRef.current.contains(target) &&
        !copyOptionsButtonRef.current?.contains(target as Node)
      ) {
        setShowCopyOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCopyOptions]);

  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }

    const timeout = window.setTimeout(() => setCopyStatus('idle'), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

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

  const clearSelection = () => {
    setSelectedIndices(new Set());
    setLastSelectedIndex(null);
  };

  const applyRangeSelection = (start: number, end: number, additive = false) => {
    if (filteredLogs.length === 0) {
      setSelectedIndices(new Set());
      setLastSelectedIndex(null);
      return;
    }

    const boundedStart = Math.min(Math.max(start, 0), filteredLogs.length - 1);
    const boundedEnd = Math.min(Math.max(end, 0), filteredLogs.length - 1);
    const [rangeStart, rangeEnd] = boundedStart <= boundedEnd ? [boundedStart, boundedEnd] : [boundedEnd, boundedStart];
    setSelectedIndices(prev => {
      const next = additive ? new Set(prev) : new Set<number>();
      for (let index = rangeStart; index <= rangeEnd; index++) {
        next.add(index);
      }
      return next;
    });
  };

  const toggleIndexSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  useEffect(() => {
    setSelectedIndices(prev => {
      const next = new Set<number>();
      prev.forEach(index => {
        if (index < filteredLogs.length) {
          next.add(index);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [filteredLogs.length]);

  useEffect(() => {
    if (lastSelectedIndex !== null && lastSelectedIndex >= filteredLogs.length) {
      setLastSelectedIndex(filteredLogs.length > 0 ? filteredLogs.length - 1 : null);
    }
  }, [filteredLogs.length, lastSelectedIndex]);

  const handleEntryMouseDown = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (event.button !== 0) {
      return;
    }

    textSelectionRef.current = !!(event.target as HTMLElement).closest('[data-log-message="true"]');
    if (textSelectionRef.current) {
      return;
    }

    ignoreClickRef.current = false;
    const additive = event.metaKey || event.ctrlKey;
    const shift = event.shiftKey;

    if (shift && lastSelectedIndex !== null) {
      applyRangeSelection(lastSelectedIndex, index, additive);
      ignoreClickRef.current = true;
    } else if (additive) {
      toggleIndexSelection(index);
      ignoreClickRef.current = true;
    } else {
      applyRangeSelection(index, index);
    }

    dragAnchorRef.current = shift && lastSelectedIndex !== null ? lastSelectedIndex : index;
    dragAdditiveRef.current = additive;
    setIsDraggingSelection(true);
    setLastSelectedIndex(index);
  };

  const handleEntryMouseEnter = (_event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!isDraggingSelection || dragAnchorRef.current === null || textSelectionRef.current) {
      return;
    }

    ignoreClickRef.current = true;
    applyRangeSelection(dragAnchorRef.current, index, dragAdditiveRef.current);
    setLastSelectedIndex(index);
  };

  const handleEntryClick = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    const additive = event.metaKey || event.ctrlKey;
    const shift = event.shiftKey;

    if (shift && lastSelectedIndex !== null) {
      applyRangeSelection(lastSelectedIndex, index, additive);
    } else if (additive) {
      toggleIndexSelection(index);
    } else {
      setSelectedIndices(new Set([index]));
    }

    setLastSelectedIndex(index);
  };

  const handleEntryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const additive = event.metaKey || event.ctrlKey;
      const shift = event.shiftKey;

      if (shift && lastSelectedIndex !== null) {
        applyRangeSelection(lastSelectedIndex, index, additive);
      } else if (additive) {
        toggleIndexSelection(index);
      } else {
        setSelectedIndices(new Set([index]));
      }
      setLastSelectedIndex(index);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearSelection();
    } else if (event.key === 'a' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      applyRangeSelection(0, filteredLogs.length - 1, true);
      setLastSelectedIndex(filteredLogs.length > 0 ? filteredLogs.length - 1 : null);
    }
  };

  const selectedLogs = useMemo(() => {
    const indices = Array.from(selectedIndices.values()).sort((a, b) => a - b);
    return indices.map(i => filteredLogs[i]).filter(Boolean);
  }, [selectedIndices, filteredLogs]);

  const formatLogEntry = (log: LogEntry) => {
    const parts: string[] = [];
    const timestamp = new Date(log.timestamp);
    const formattedTime = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}.${timestamp.getMilliseconds().toString().padStart(3, '0')}`;

    if (copyOptions.includeTimestamp) {
      parts.push(formattedTime);
    }

    if (copyOptions.includeLevel) {
      parts.push(`[${log.level}]`);
    }

    let message = log.message ?? '';
    if (!copyOptions.preserveLineBreaks) {
      message = message.replace(/\r?\n/g, ' ');
    }

    if (copyOptions.includeContext && log.context) {
      const contextString = copyOptions.preserveLineBreaks
        ? JSON.stringify(log.context, null, 2)
        : JSON.stringify(log.context);
      message = `${message}${message ? ' ' : ''}${contextString}`;
    }

    parts.push(message);

    return parts.filter(Boolean).join(' ');
  };

  const handleCopySelected = async () => {
    if (selectedLogs.length === 0) {
      return;
    }

    const formatted = selectedLogs.map(formatLogEntry).join(copyOptions.preserveLineBreaks ? '\n' : ' ');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formatted);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStatus('success');
    } catch (error) {
      console.error('Failed to copy logs:', error);
      setCopyStatus('error');
    }
  };

  const copyStatusLabel = useMemo(() => {
    if (copyStatus === 'success') {
      return `${selectedLogs.length} log${selectedLogs.length === 1 ? '' : 's'} copied to clipboard.`;
    }
    if (copyStatus === 'error') {
      return 'Copy failed. Try again.';
    }
    return '';
  }, [copyStatus, selectedLogs.length]);

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
          <div className="flex items-center space-x-1">
            <Tooltip text="Copy selected entries">
              <button
                onClick={handleCopySelected}
                disabled={selectedIndices.size === 0}
                className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-md transition-colors border ${
                  selectedIndices.size === 0
                    ? 'bg-bunker-100 dark:bg-bunker-800 text-bunker-400 border-transparent cursor-not-allowed'
                    : 'bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800'
                }`}
                aria-label="Copy selected log entries"
              >
                <Icon name="copy" className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </Tooltip>
            <div className="relative">
              <Tooltip text="Copy formatting options">
                <button
                  ref={copyOptionsButtonRef}
                  onClick={() => setShowCopyOptions(prev => !prev)}
                  className="flex items-center justify-center p-1 rounded-md bg-bunker-100 dark:bg-bunker-800 hover:bg-bunker-200 dark:hover:bg-bunker-700"
                  aria-haspopup="true"
                  aria-expanded={showCopyOptions}
                  aria-controls="log-copy-options"
                >
                  <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${showCopyOptions ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>
              {showCopyOptions && (
                <div
                  id="log-copy-options"
                  ref={copyOptionsPanelRef}
                  className="absolute right-0 mt-2 w-64 rounded-md border border-bunker-200 dark:border-bunker-700 bg-white dark:bg-bunker-900 shadow-lg p-3 text-sm space-y-2 z-10"
                >
                  <p className="text-xs uppercase tracking-wide text-bunker-400 dark:text-bunker-500">Copy formatting</p>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={copyOptions.includeTimestamp}
                      onChange={event => setCopyOptions(options => ({ ...options, includeTimestamp: event.target.checked }))}
                      className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Include timestamps</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={copyOptions.includeLevel}
                      onChange={event => setCopyOptions(options => ({ ...options, includeLevel: event.target.checked }))}
                      className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Include log levels</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={copyOptions.includeContext}
                      onChange={event => setCopyOptions(options => ({ ...options, includeContext: event.target.checked }))}
                      className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Include context payloads</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={copyOptions.preserveLineBreaks}
                      onChange={event => setCopyOptions(options => ({ ...options, preserveLineBreaks: event.target.checked }))}
                      className="h-4 w-4 rounded border-bunker-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Preserve line breaks</span>
                  </label>
                </div>
              )}
            </div>
          </div>
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
        <div className="flex items-center justify-between text-[11px] text-bunker-400 dark:text-bunker-500 mb-1">
          <div>
            {selectedIndices.size > 0 ? `${selectedIndices.size} selected` : 'Click entries to select'}
          </div>
          {copyStatusLabel && (
            <div className={`flex items-center space-x-1 ${copyStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              <Icon name={copyStatus === 'error' ? 'warning' : 'check'} className="w-3 h-3" />
              <span>{copyStatusLabel}</span>
            </div>
          )}
        </div>
        {filteredLogs.map((log, i) => {
          const d = new Date(log.timestamp);
          const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
          const isSelected = selectedIndices.has(i);
          return (
          <div
            key={`${log.timestamp}-${i}`}
            className={`flex items-start p-1 rounded border transition-colors cursor-pointer ${
              isSelected
                ? 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 shadow-inner'
                : 'border-transparent hover:bg-bunker-50 dark:hover:bg-bunker-900'
            } ${levelStyles[log.level].text}`}
            onMouseDown={event => handleEntryMouseDown(event, i)}
            onMouseEnter={event => handleEntryMouseEnter(event, i)}
            onClick={event => handleEntryClick(event, i)}
            role="button"
            tabIndex={0}
            onKeyDown={event => handleEntryKeyDown(event, i)}
            aria-pressed={isSelected}
          >
            <span className="flex-shrink-0 w-48 text-bunker-400 dark:text-bunker-500 pr-2 select-none" aria-hidden="true">{time}</span>
            <span className="flex-shrink-0 font-bold w-20 select-none" aria-hidden="true">[{log.level}]</span>
            <span className="flex-grow whitespace-pre-wrap break-words" data-log-message="true">
              {log.message} {log.context && JSON.stringify(log.context, null, 2)}
            </span>
          </div>
        );
        })}
      </div>
    </div>
  );
};