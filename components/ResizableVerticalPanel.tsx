import React, { useRef, useCallback, Children, useEffect, useState } from 'react';

interface ResizableVerticalPanelProps {
  children: React.ReactNode;
  height: number;
  onResize: (height: number) => void;
  minHeight?: number;
  className?: string;
}

const ResizeHandle: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
  <div
    className="h-2 bg-bunker-100 dark:bg-bunker-800 cursor-row-resize hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors duration-200 flex-shrink-0 group"
    onMouseDown={onMouseDown}
  >
    <div className="w-full h-full flex items-center justify-center">
        <div className="h-0.5 w-8 bg-bunker-300 dark:bg-bunker-600 rounded-full group-hover:bg-white/50" />
    </div>
  </div>
);

export const ResizableVerticalPanel: React.FC<ResizableVerticalPanelProps> = ({ children, height, onResize, minHeight = 80, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    startY: number;
    initialHeight: number;
  } | null>(null);
  
  const panels = Children.toArray(children);
  if (panels.length !== 2) {
    throw new Error("ResizableVerticalPanel expects exactly two children.");
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragInfoRef.current = {
      startY: e.clientY,
      initialHeight: height,
    };
    setIsDragging(true);
    e.preventDefault();
  }, [height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragInfoRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfoRef.current || !containerRef.current) return;

    const { startY, initialHeight } = dragInfoRef.current;
    
    const deltaY = e.clientY - startY;
    
    const containerHeight = containerRef.current.offsetHeight;
    const maxHeight = containerHeight - minHeight;
    
    let newHeight = initialHeight - deltaY;
    
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    onResize(newHeight);
  }, [onResize, minHeight]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  const [topPanel, bottomPanel] = panels;

  return (
    <div ref={containerRef} className={`flex flex-col w-full h-full ${className}`}>
        <div className="flex-grow min-h-0">
          {topPanel}
        </div>
        <ResizeHandle onMouseDown={handleMouseDown} />
        <div style={{ height: `${height}px` }} className="flex-shrink-0 overflow-hidden">
          {bottomPanel}
        </div>
    </div>
  );
};