import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactElement;
  text: React.ReactNode;
  placement?: Placement; // preferred placement
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, placement = 'bottom' }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const { innerWidth: vpWidth, innerHeight: vpHeight } = window;
    const margin = 8; // 8px margin from viewport edges and trigger

    const placements: Record<Placement, { top: number; left: number }> = {
      top: {
        top: triggerRect.top - tooltipRect.height - margin,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      },
      bottom: {
        top: triggerRect.bottom + margin,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      },
      left: {
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.left - tooltipRect.width - margin,
      },
      right: {
        top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
        left: triggerRect.right + margin,
      },
    };

    const fits = (pos: { top: number; left: number }): boolean => {
      return (
        pos.top >= margin &&
        pos.left >= margin &&
        pos.top + tooltipRect.height <= vpHeight - margin &&
        pos.left + tooltipRect.width <= vpWidth - margin
      );
    };

    // Define fallback order for each placement
    const fallbackOrder: Record<Placement, Placement[]> = {
      bottom: ['bottom', 'top', 'right', 'left'],
      top: ['top', 'bottom', 'right', 'left'],
      right: ['right', 'left', 'top', 'bottom'],
      left: ['left', 'right', 'top', 'bottom'],
    };

    let bestPlacement: Placement | null = null;
    for (const p of fallbackOrder[placement]) {
      if (fits(placements[p])) {
        bestPlacement = p;
        break;
      }
    }

    // If nothing fits perfectly, we'll take the preferred one and adjust it.
    if (!bestPlacement) {
        bestPlacement = placement;
    }

    let { top, left } = placements[bestPlacement];
    
    // Final boundary checks to clamp the position
    if (left < margin) left = margin;
    if (left + tooltipRect.width > vpWidth - margin) {
      left = vpWidth - tooltipRect.width - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipRect.height > vpHeight - margin) {
      top = vpHeight - tooltipRect.height - margin;
    }

    setPosition({ top, left });
    setOpacity(1); // Make it visible after positioning
  }, [placement]);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => {
    // Start fade out transition
    setOpacity(0);
    // After transition, hide the element from DOM, but only if the mouse isn't re-entering
    const timer = setTimeout(() => {
        setVisible(false);
    }, 200); // must match transition duration
    
    if (triggerRef.current) {
        triggerRef.current.dataset.tooltipTimer = String(timer);
    }
  };
  
  const handleMouseEnter = () => {
      if (triggerRef.current?.dataset.tooltipTimer) {
          clearTimeout(Number(triggerRef.current.dataset.tooltipTimer));
      }
      setVisible(true);
  }
  
  useLayoutEffect(() => {
    if (visible) {
      // The position is calculated once the tooltip is rendered (and has dimensions)
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true); // Use capture to catch scroll events inside scrollable containers
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [visible, text, calculatePosition]);

  const tooltipElement = visible && text && createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      style={{ top: `${position.top}px`, left: `${position.left}px`, opacity: opacity }}
      className="fixed w-max max-w-xs p-2.5 bg-white dark:bg-bunker-900 border border-bunker-200 dark:border-bunker-800 text-bunker-900 dark:text-bunker-100 text-xs rounded-lg shadow-lg z-50 transition-opacity duration-200"
    >
      {text}
    </div>,
    document.body
  );

  return (
    <>
      <div 
        ref={triggerRef} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={hideTooltip} 
        onFocus={handleMouseEnter} 
        onBlur={hideTooltip} 
        className="flex items-center"
      >
        {children}
      </div>
      {tooltipElement}
    </>
  );
};
