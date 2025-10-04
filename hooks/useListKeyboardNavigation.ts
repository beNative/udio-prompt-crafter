import type { HTMLAttributes, KeyboardEvent, MouseEventHandler } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseListKeyboardNavigationOptions<T> {
  items: T[];
  getId: (item: T) => string;
  activeId?: string | null;
  onSelect?: (item: T, index: number) => void;
}

interface GetItemPropsOptions {
  onClick?: MouseEventHandler<HTMLElement>;
}

interface UseListKeyboardNavigationResult<T> {
  listProps: HTMLAttributes<HTMLUListElement>;
  getItemProps: (
    item: T,
    index: number,
    options?: GetItemPropsOptions
  ) => HTMLAttributes<HTMLElement> & {
    ref: (element: HTMLElement | null) => void;
  };
  activeIndex: number;
}

export const useListKeyboardNavigation = <T,>({
  items,
  getId,
  activeId,
  onSelect,
}: UseListKeyboardNavigationOptions<T>): UseListKeyboardNavigationResult<T> => {
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(() => {
    if (!items.length) return -1;
    if (activeId) {
      const activeIndex = items.findIndex(item => getId(item) === activeId);
      if (activeIndex !== -1) {
        return activeIndex;
      }
    }
    return 0;
  });

  const activeIndex = useMemo(() => {
    if (!activeId) return -1;
    return items.findIndex(item => getId(item) === activeId);
  }, [items, getId, activeId]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(() => {
    if (!items.length) {
      setFocusedIndex(-1);
      return;
    }

    if (activeIndex !== -1) {
      setFocusedIndex(activeIndex);
      return;
    }

    setFocusedIndex(prev => {
      if (prev >= 0 && prev < items.length) {
        return prev;
      }
      return 0;
    });
  }, [items, activeIndex]);

  const handleItemSelect = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setFocusedIndex(index);
      const element = itemRefs.current[index];
      if (element) {
        element.focus({ preventScroll: true });
      }
      onSelect?.(items[index], index);
    },
    [items, onSelect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      if (!items.length) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          handleItemSelect(Math.min(index + 1, items.length - 1));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          handleItemSelect(Math.max(index - 1, 0));
          break;
        case 'Home':
        case 'PageUp':
          event.preventDefault();
          handleItemSelect(0);
          break;
        case 'End':
        case 'PageDown':
          event.preventDefault();
          handleItemSelect(items.length - 1);
          break;
        case 'Enter':
        case ' ': // Space
          event.preventDefault();
          handleItemSelect(index);
          break;
        default:
          break;
      }
    },
    [items.length, handleItemSelect]
  );

  const listProps = useMemo<HTMLAttributes<HTMLUListElement>>(
    () => ({
      role: 'listbox',
      'aria-orientation': 'vertical',
    }),
    []
  );

  const getItemProps = useCallback<
    UseListKeyboardNavigationResult<T>['getItemProps']
  >(
    (item, index, options) => {
      const { onClick } = options || {};
      const id = getId(item);
      const isActive = activeId ? id === activeId : index === focusedIndex;

      return {
        ref: (element: HTMLElement | null) => {
          itemRefs.current[index] = element;
        },
        tabIndex: index === focusedIndex ? 0 : -1,
        role: 'option',
        'aria-selected': isActive,
        onFocus: () => setFocusedIndex(index),
        onKeyDown: event => handleKeyDown(event, index),
        onClick: event => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            handleItemSelect(index);
          }
        },
      };
    },
    [activeId, focusedIndex, getId, handleItemSelect, handleKeyDown]
  );

  return {
    listProps,
    getItemProps,
    activeIndex: focusedIndex,
  };
};
