import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../index';

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
  const { settings } = useSettings();
  const scale = (settings?.uiScale || 100) / 100;

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    // These values are in "visual" pixels, affected by the zoom level
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
    // FIX: Using `as const` ensures that the array values are inferred as literal types (`'top'`, `'bottom'`, etc.)
    // rather than the wider `string` type. This fixes the error where a `string` was not assignable to `Placement`.
    // FIX: Added 'as const' to correctly infer literal types for the fallback order array, resolving the type error.
    const fallbackOrder = {
      bottom: ['bottom', 'top', 'right', 'left'],
      top: ['top', 'bottom', 'right', 'left'],
      right: ['right', 'left', 'top', 'bottom'],
      left: ['left', 'right', 'top', 'bottom'],
    } as const;

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
    
    // Final boundary checks to clamp the position (still in visual pixels)
    if (left < margin) left = margin;
    if (left + tooltipRect.width > vpWidth - margin) {
      left = vpWidth - tooltipRect.width - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipRect.height > vpHeight - margin) {
      top = vpHeight - tooltipRect.height - margin;
    }

    // Convert the final visual coordinates to layout coordinates by dividing by the scale factor.
    // The browser will then apply the zoom to these layout coordinates, putting the tooltip in the correct visual spot.
    setPosition({ top: top / scale, left: left / scale });
    setOpacity(1); // Make it visible after positioning
  }, [placement, scale]);

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
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity,
        transform: `scale(${0.96 + opacity * 0.04})`,
      }}
      className="fixed pointer-events-none w-max max-w-sm px-3 py-2 bg-white/95 dark:bg-bunker-900/95 border border-bunker-200/70 dark:border-bunker-700/70 text-bunker-800 dark:text-bunker-100 text-sm font-medium leading-snug rounded-xl shadow-2xl backdrop-blur-sm whitespace-pre-line z-50 transition-all duration-200"
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
        className="inline-flex items-center"
      >
        {children}
      </div>
      {tooltipElement}
    </>
  );
};