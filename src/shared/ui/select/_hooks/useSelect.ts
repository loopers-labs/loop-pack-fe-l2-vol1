import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  SelectOption,
  UseSelectProps,
  UseSelectReturn,
} from '../_types/select';

function getNextEnabledIndex<T>(
  options: SelectOption<T>[],
  current: number,
  direction: 1 | -1,
): number {
  const len = options.length;
  if (len === 0) return -1;

  let next = current;
  for (let i = 0; i < len; i++) {
    next = (next + direction + len) % len;
    if (!options[next].isDisabled) return next;
  }
  return -1;
}

export function useSelect<T>({
  options,
  selectedOption: controlledSelected,
  onSelectedOptionChange,
}: UseSelectProps<T>): UseSelectReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalSelected, setInternalSelected] =
    useState<SelectOption<T> | null>(null);

  const isControlled = controlledSelected !== undefined;
  const selectedOption = isControlled ? controlledSelected : internalSelected;
  const wasControlledRef = useRef(isControlled);

  useEffect(() => {
    if (wasControlledRef.current !== isControlled) {
      const from = wasControlledRef.current ? 'controlled' : 'uncontrolled';
      const to = isControlled ? 'controlled' : 'uncontrolled';
      console.warn(
        `useSelect가 ${from}에서 ${to}로 전환되었습니다. 컴포넌트 생명주기 동안 하나의 모드를 유지해야 합니다.`,
      );
    }
    wasControlledRef.current = isControlled;
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    const selectedIdx = selectedOption
      ? options.findIndex((o) => o.value === selectedOption.value)
      : -1;
    const startIdx =
      selectedIdx !== -1 && !options[selectedIdx].isDisabled
        ? selectedIdx
        : getNextEnabledIndex(options, -1, 1);
    setHighlightedIndex(startIdx);
  }, [options, selectedOption]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      if (option.isDisabled) return;
      if (!isControlled) setInternalSelected(option);
      onSelectedOptionChange?.(option);
      handleClose();
    },
    [isControlled, onSelectedOptionChange, handleClose],
  );

  // click-outside
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else if (
            highlightedIndex >= 0 &&
            !options[highlightedIndex].isDisabled
          ) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else {
            setHighlightedIndex((prev) =>
              getNextEnabledIndex(options, prev, 1),
            );
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              getNextEnabledIndex(options, prev, -1),
            );
          }
          break;
        }
        case 'Escape': {
          if (isOpen) {
            e.preventDefault();
            handleClose();
          }
          break;
        }
      }
    },
    [isOpen, highlightedIndex, options, handleOpen, handleClose, handleSelect],
  );

  const getToggleButtonProps = useCallback(
    () => ({
      role: 'combobox' as const,
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox' as const,
      onClick: () => (isOpen ? handleClose() : handleOpen()),
      onKeyDown: handleKeyDown,
    }),
    [isOpen, handleOpen, handleClose, handleKeyDown],
  );

  const getMenuProps = useCallback(
    () => ({
      role: 'listbox' as const,
      'aria-hidden': !isOpen,
    }),
    [isOpen],
  );

  const getItemProps = useCallback(
    ({ item, index }: { item: SelectOption<T>; index: number }) => {
      const isHighlighted = index === highlightedIndex;
      const isSelected = selectedOption?.value === item.value;
      const isDisabled = item.isDisabled ?? false;

      return {
        role: 'option' as const,
        'data-highlighted': isHighlighted,
        'data-selected': isSelected,
        'data-disabled': isDisabled,
        'aria-selected': isSelected,
        'aria-disabled': isDisabled,
        onClick: () => handleSelect(item),
        onMouseEnter: () => {
          if (!isDisabled) setHighlightedIndex(index);
        },
      };
    },
    [highlightedIndex, selectedOption, handleSelect],
  );

  return {
    isOpen,
    highlightedIndex,
    selectedOption,
    containerRef,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  };
}
