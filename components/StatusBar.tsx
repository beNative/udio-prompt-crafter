import React from 'react';
import type { AiStatus } from '../types';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

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
    <Tooltip text={text}>
      <div className="flex items-center space-x-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs hidden sm:inline">{text}</span>
      </div>
    </Tooltip>
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({ appVersion, tagCount, conflictCount, aiStatus }) => {
  return (
    <footer className="flex-shrink-0 bg-white/80 dark:bg-bunker-950/80 backdrop-blur-sm border-t border-bunker-200/80 dark:border-bunker-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-bunker-600 dark:text-bunker-400">
      <div className="flex items-center space-x-4">
        <span className="font-semibold text-bunker-700 dark:text-bunker-300">UDIO Prompt Crafter {appVersion && `v${appVersion}`}</span>
        <div className="h-4 border-l border-bunker-200 dark:border-bunker-700"></div>
        <span>Designed by Tim Sinaeve</span>
      </div>
      <div className="flex items-center space-x-4">
        <Tooltip text="Selected Tags">
          <div className="flex items-center space-x-1.5">
            <Icon name="tag" className="w-4 h-4" />
            <span>{tagCount}</span>
          </div>
        </Tooltip>
        <Tooltip text="Tag Conflicts">
          <div className={`flex items-center space-x-1.5 transition-colors ${conflictCount > 0 ? 'text-red-500 dark:text-red-400' : ''}`}>
            <Icon name="warning" className="w-4 h-4" />
            <span>{conflictCount}</span>
          </div>
        </Tooltip>
        <AiStatusIndicator status={aiStatus} />
      </div>
    </footer>
  );
};