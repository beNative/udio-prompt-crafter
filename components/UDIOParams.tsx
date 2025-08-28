
import React from 'react';
import type { UDIOParams } from '../types';

interface UDIOParamsEditorProps {
    params: UDIOParams;
    onChange: (newParams: UDIOParams) => void;
}

export const UDIOParamsEditor: React.FC<UDIOParamsEditorProps> = ({ params, onChange }) => {
    
    const handleStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...params, promptStrength: parseInt(e.target.value, 10) });
    };

    const handleDifferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...params, remixDifference: parseFloat(e.target.value) });
    };

    return (
        <div className="p-4 bg-bunker-100 dark:bg-bunker-800/50 rounded-lg border border-bunker-200 dark:border-bunker-700">
            <h3 className="text-md font-semibold text-bunker-900 dark:text-white mb-3">UDIO Parameters</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="prompt-strength" className="flex justify-between text-sm text-bunker-600 dark:text-bunker-300 mb-1">
                        <span>Prompt Strength</span>
                        <span className="font-mono text-bunker-800 dark:text-white bg-bunker-200 dark:bg-bunker-700 px-1.5 py-0.5 rounded">{params.promptStrength}%</span>
                    </label>
                    <input
                        id="prompt-strength"
                        type="range"
                        min="80"
                        max="100"
                        step="1"
                        value={params.promptStrength}
                        onChange={handleStrengthChange}
                        className="w-full h-2 bg-bunker-300 dark:bg-bunker-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="remix-difference" className="flex justify-between text-sm text-bunker-600 dark:text-bunker-300 mb-1">
                        <span>Remix Difference</span>
                         <span className="font-mono text-bunker-800 dark:text-white bg-bunker-200 dark:bg-bunker-700 px-1.5 py-0.5 rounded">{params.remixDifference.toFixed(2)}</span>
                    </label>
                    <input
                        id="remix-difference"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={params.remixDifference}
                        onChange={handleDifferenceChange}
                        className="w-full h-2 bg-bunker-300 dark:bg-bunker-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};
