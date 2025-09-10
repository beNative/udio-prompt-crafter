import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactElement;
  text: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  const updatePosition = useCallback(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = triggerRect.bottom + 8; // 8px margin
      let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // Prevent tooltip from going off-screen horizontally
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      // Flip to top if not enough space below and there is enough space above
      if (top + tooltipRect.height > window.innerHeight - 8 && triggerRect.top - tooltipRect.height - 8 > 0) {
        top = triggerRect.top - tooltipRect.height - 8;
      }
      
      setPosition({ top, left });
      setShow(true);
    }
  }, []);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => {
    setVisible(false);
    setShow(false);
  };
  
  useLayoutEffect(() => {
    if (visible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [visible, text, updatePosition]);

  const tooltipElement = visible && text && createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      style={{ top: `${position.top}px`, left: `${position.left}px`, opacity: show ? 1 : 0 }}
      className="fixed w-max max-w-xs p-2.5 bg-white dark:bg-bunker-900 border border-bunker-200 dark:border-bunker-800 text-bunker-900 dark:text-bunker-100 text-xs rounded-lg shadow-lg z-50 transition-opacity duration-200"
    >
      {text}
    </div>,
    document.body
  );

  return (
    <>
      <div ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip} className="flex items-center">
        {children}
      </div>
      {tooltipElement}
    </>
  );
};