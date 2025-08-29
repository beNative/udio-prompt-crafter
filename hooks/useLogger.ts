import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { LogEntry } from '../types';

const MAX_LOGS = 500; // Keep the in-memory log list from growing indefinitely

export function useLogger(): [LogEntry[], (logs: LogEntry[]) => void] {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const handleNewLog = (log: LogEntry) => {
      setLogs(prevLogs => {
          const newLogs = [...prevLogs, log];
          if (newLogs.length > MAX_LOGS) {
              // Slice from the beginning to remove the oldest logs
              return newLogs.slice(newLogs.length - MAX_LOGS);
          }
          return newLogs;
      });
    };

    const unsubscribe = logger.subscribe(handleNewLog);

    return () => {
      unsubscribe();
    };
  }, []);

  return [logs, setLogs];
}
