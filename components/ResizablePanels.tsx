import React, { useRef, useCallback, Children, useEffect, useState } from 'react';

interface ResizablePanelsProps {
  children: React.ReactNode;
  sizes: number[];
  onResize: (sizes: number[]) => void;
  minSize?: number;
  className?: string;
}

const ResizeHandle: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
  <div
    className="w-2 bg-bunker-100 dark:bg-bunker-800 cursor-col-resize hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors duration-200 flex-shrink-0 group"
    onMouseDown={onMouseDown}
  >
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-0.5 h-8 bg-bunker-300 dark:bg-bunker-600 rounded-full group-hover:bg-white/50" />
    </div>
  </div>
);

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({ children, sizes, onResize, minSize = 10, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    index: number;
    startX: number;
    initialSizes: number[];
  } | null>(null);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    dragInfoRef.current = {
      index,
      startX: e.clientX,
      initialSizes: [...sizes],
    };
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragInfoRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfoRef.current || !containerRef.current) return;

    const { index, startX, initialSizes } = dragInfoRef.current;
    
    // Total width calculation needs to account for handles
    const handleCount = Children.count(children) - 1;
    const handlesWidth = handleCount * 8; // w-2 is 8px
    const containerWidth = containerRef.current.offsetWidth - handlesWidth;
    
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    
    const newSizes = [...initialSizes];
    
    let leftSize = initialSizes[index];
    let rightSize = initialSizes[index+1];
    let totalSize = leftSize + rightSize;
    
    let newLeftSize = leftSize + deltaPercent;
    let newRightSize = rightSize - deltaPercent;
    
    if (newLeftSize < minSize) {
        newRightSize -= (minSize - newLeftSize);
        newLeftSize = minSize;
    }
    if (newRightSize < minSize) {
        newLeftSize -= (minSize - newRightSize);
        newRightSize = minSize;
    }

    // Clamp sizes to not exceed their combined total
    newLeftSize = Math.max(minSize, Math.min(totalSize - minSize, newLeftSize));
    newRightSize = totalSize - newLeftSize;

    newSizes[index] = newLeftSize;
    newSizes[index+1] = newRightSize;
    
    onResize(newSizes);
  }, [onResize, minSize, children]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    
    document.body.style.cursor = 'col-resize';

    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const panels = Children.toArray(children);

  return (
    <div ref={containerRef} className={`flex w-full h-full ${className}`}>
      {panels.map((panel, index) => (
        <React.Fragment key={index}>
          <div style={{ flexBasis: `${sizes[index]}%` }} className="flex-shrink-0 h-full min-w-0 overflow-hidden">
            {panel}
          </div>
          {index < panels.length - 1 && (
            <ResizeHandle onMouseDown={(e) => handleMouseDown(index, e)} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
