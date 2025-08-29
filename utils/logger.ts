import type { LogEntry, LogLevel } from '../types';

type LogListener = (log: LogEntry) => void;

class Logger {
  private listeners: Set<LogListener> = new Set();
  private logToFile: boolean = false;
  
  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(log: LogEntry) {
    // Notify all UI listeners
    this.listeners.forEach(listener => listener(log));
    
    // If file logging is on and we're in Electron, write to the file
    if (this.logToFile && window.electronAPI?.writeLog) {
      window.electronAPI.writeLog(log);
    }
  }

  public setLogToFile(enabled: boolean) {
    if (this.logToFile !== enabled) {
        this.logToFile = enabled;
        this.info(`File logging has been ${enabled ? 'enabled' : 'disabled'}.`);
    }
  }
  
  public isFileLoggingEnabled(): boolean {
      return this.logToFile;
  }

  private log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context !== undefined && { context }),
    };
    this.emit(entry);
  }

  public debug(message: string, context?: any) {
    this.log('DEBUG', message, context);
  }

  public info(message: string, context?: any) {
    this.log('INFO', message, context);
  }

  public warn(message: string, context?: any) {
    this.log('WARNING', message, context);
  }

  public error(message: string, context?: any) {
    this.log('ERROR', message, context);
  }
}

export const logger = new Logger();
