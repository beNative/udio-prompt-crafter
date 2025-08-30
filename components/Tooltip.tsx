
import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactElement;
  text: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  const [visible, setVisible] = useState(false);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <div className="relative flex items-center" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
      {children}
      {visible && text && (
        <div 
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-xs p-2.5 bg-bunker-800/95 dark:bg-bunker-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-lg z-50 transition-opacity duration-200"
        >
          {text}
        </div>
      )}
    </div>
  );
};