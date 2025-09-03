import React from 'react';
import type { UdioParams } from '../types';

interface UDIOParamsProps {
  params: UdioParams;
  onChange: (newParams: UdioParams) => void;
}

export const UDIOParams: React.FC<UDIOParamsProps> = ({ params, onChange }) => {

  const handleToggleInstrumental = () => {
    const newInstrumentalState = !params.instrumental;
    onChange({ 
        ...params, 
        instrumental: newInstrumentalState, 
        // Clear lyrics when switching to instrumental
        lyrics: newInstrumentalState ? '' : params.lyrics 
    });
  };
  
  const handleLyricsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...params, lyrics: e.target.value });
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow clearing the input
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    onChange({ ...params, duration: value });
  };

  return (
    <div className="h-full p-4 bg-bunker-50 dark:bg-bunker-900 rounded-lg text-bunker-800 dark:text-bunker-200 border border-bunker-200 dark:border-bunker-800 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium text-bunker-800 dark:text-bunker-200">
              Instrumental
              <p className="text-sm font-normal text-bunker-500 dark:text-bunker-400 mt-1">
                Mark the track as instrumental (no vocals will be generated).
              </p>
            </span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={params.instrumental}
                onChange={handleToggleInstrumental}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-bunker-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-bunker-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-bunker-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-bunker-600 peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        <div className={`transition-opacity duration-300 ${params.instrumental ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}>
          <label htmlFor="lyrics" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">
            Lyrics
            <p className="text-xs font-normal text-bunker-500 dark:text-bunker-400 mt-1">
              Provide your own lyrics. If left blank, UDIO will generate them. Disabled for instrumental tracks.
            </p>
          </label>
          <textarea
            id="lyrics"
            value={params.lyrics || ''}
            onChange={handleLyricsChange}
            disabled={params.instrumental}
            className="mt-2 w-full h-48 p-3 bg-white dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md text-bunker-900 dark:text-white placeholder-bunker-400 dark:placeholder-bunker-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm disabled:cursor-not-allowed"
            placeholder="[Verse 1]
The city sleeps in shades of gray..."
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-bunker-700 dark:text-bunker-300">
            Duration (in seconds)
            <p className="text-xs font-normal text-bunker-500 dark:text-bunker-400 mt-1">
              Suggest a target duration for the track. Leave blank for default.
            </p>
          </label>
          <input
            id="duration"
            type="number"
            value={params.duration === undefined ? '' : params.duration}
            onChange={handleDurationChange}
            min="1"
            className="form-input mt-2 w-48"
            placeholder="e.g., 180"
          />
        </div>
      </div>
    </div>
  );
};
