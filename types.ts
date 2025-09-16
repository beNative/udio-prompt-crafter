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
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'gray';
}

export type Taxonomy = Category[];

export interface SelectedTag extends Tag {
  categoryId: string;
  isLocked?: boolean;
}

export interface UdioParams {
  lyrics?: string;
  instrumental: boolean;
  duration?: number;
}

export interface Preset {
  name: string;
  description?: string;
  isFavorite?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  selectedTags: Record<string, { categoryId: string; isLocked?: boolean; }>;
  categoryOrder: string[];
  udioParams?: UdioParams;
  textCategoryValues?: Record<string, string>;
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
  iconSet?: 'heroicons' | 'lucide' | 'feather' | 'tabler';
  allowPrerelease?: boolean;
  uiScale?: number;
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
  udioParams?: UdioParams;
}

// New Toast Notification types
export interface Toast {
  id: number;
  type: 'info' | 'success' | 'error' | 'loading';
  title: string;
  message: string;
  duration?: number;
  actions?: { label: string; onClick: () => void }[];
  progress?: number; // For download progress
}

// Auto-update info type
export interface UpdateInfo {
  version: string;
  files: any[];
  path: string;
  sha512: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string | any[];
}


// New Electron API types
export interface IElectronAPI {
  writeLog: (logEntry: LogEntry) => void;
  showLogInFolder: () => void;
  showSettingsInFolder: () => void;
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
  // Auto-update API
  onUpdateEvent: (callback: (event: string, data?: any) => void) => () => void;
  checkForUpdates: () => void;
  downloadUpdate: () => void;
  restartAndInstall: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}