export interface Tag {
  id: string;
  label: string;
  description: string;
  synonyms?: string[];
  example_snippet?: string;
  conflictsWith?: string[];
  suggests?: string[];
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: 'tags' | 'text' | 'helper_input';
  tags: Tag[];
}

export type Taxonomy = Category[];

export interface SelectedTag extends Tag {
  categoryId: string;
}

export interface Preset {
  name:string;
  selectedTags: Record<string, Omit<SelectedTag, 'id' | 'label' | 'description' | 'synonyms' | 'example_snippet' | 'conflictsWith' | 'suggests' | 'color'>>;
  categoryOrder: string[];
}

export interface Conflict {
  tagA: Tag;
  tagB: Tag;
}

export interface AiSettings {
  provider: 'ollama' | 'lmstudio';
  baseUrl: string;
  model: string;
}

export type AiStatus = 'checking' | 'connected' | 'disconnected';

export interface AppSettings {
  aiSettings: AiSettings;
  presets: Preset[];
  promptPanelRatio?: number;
  openDevToolsOnStart?: boolean;
  iconSet?: 'heroicons' | 'lucide';
}

// New Logging types
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export interface LogEntry {
  timestamp: string; // ISO string for consistency
  level: LogLevel;
  message: string;
  context?: any;
}

export interface HistoryEntry {
  timestamp: string; // ISO string
  promptString: string;
  selectedTags: Preset['selectedTags'];
  categoryOrder: string[];
  textCategoryValues: Record<string, string>;
}

// New Electron API types
export interface IElectronAPI {
  writeLog: (logEntry: LogEntry) => void;
  showItemInFolder: () => void;
  getLogsPath: () => Promise<string>;
  readSettings: () => Promise<AppSettings>;
  writeSettings: (settings: AppSettings) => void;
  readMarkdownFile: (filename: string) => Promise<string>;
  getAppVersion: () => Promise<string>;
  readDebugLog: () => Promise<string>;
  readDefaultTaxonomy: () => Promise<{ taxonomy: Taxonomy }>;
  readCustomTaxonomy: () => Promise<Taxonomy | null>;
  writeCustomTaxonomy: (taxonomy: Taxonomy) => void;
  resetCustomTaxonomy: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}