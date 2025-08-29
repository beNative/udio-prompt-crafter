import React from 'react';
import type { AiStatus } from '../types';
import { Icon } from './icons';

interface StatusBarProps {
  appVersion: string;
  tagCount: number;
  conflictCount: number;
  aiStatus: AiStatus;
}

const AiStatusIndicator: React.FC<{ status: AiStatus }> = ({ status }) => {
  const statusMap = {
    checking: { color: 'bg-yellow-400', text: 'Checking AI Service...' },
    connected: { color: 'bg-green-400', text: 'AI Service Connected' },
    disconnected: { color: 'bg-red-400', text: 'AI Service Disconnected' },
  };
  const { color, text } = statusMap[status];

  return (
    <div className="flex items-center space-x-2" title={text}>
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs hidden sm:inline">{text}</span>
    </div>
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({ appVersion, tagCount, conflictCount, aiStatus }) => {
  return (
    <footer className="flex-shrink-0 bg-white/80 dark:bg-bunker-950/80 backdrop-blur-sm border-t border-bunker-200/80 dark:border-bunker-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-bunker-600 dark:text-bunker-400">
      <div className="flex items-center space-x-4">
        <span className="font-semibold text-bunker-700 dark:text-bunker-300">UDIO Prompt Crafter {appVersion && `v${appVersion}`}</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5" title="Selected Tags">
          <Icon name="tag" className="w-4 h-4" />
          <span>{tagCount}</span>
        </div>
        <div className={`flex items-center space-x-1.5 transition-colors ${conflictCount > 0 ? 'text-red-500 dark:text-red-400' : ''}`} title="Tag Conflicts">
          <Icon name="warning" className="w-4 h-4" />
          <span>{conflictCount}</span>
        </div>
        <AiStatusIndicator status={aiStatus} />
      </div>
    </footer>
  );
};