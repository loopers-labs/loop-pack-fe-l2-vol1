import { UseSelectProps } from '@/types/products';
import { useState } from 'react';

// select를 열었다. 하이라이트, disabled, 무료배송이 있고 없고
// 클릭이벤트, onChange,
export function useSelect<T>({ options, isDisabled }: UseSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (option: T) => {
    if (isDisabled(option)) return;
    setSelectedOption(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        if (!isOpen) {
          setIsOpen(true);
          break;
        }
        let nextIndex = highlightedIndex + 1;
        while (nextIndex < options.length && isDisabled(options[nextIndex])) {
          nextIndex = nextIndex + 1;
        }

        if (nextIndex < options.length) {
          setHighlightedIndex(nextIndex);
        }
        break;
      }
      case 'ArrowUp': {
        let prevIndex = highlightedIndex - 1;
        while (prevIndex > -1 && isDisabled(options[prevIndex])) {
          prevIndex = prevIndex - 1;
        }

        if (prevIndex > -1) {
          setHighlightedIndex(prevIndex);
        }
        break;
      }
      case 'Enter':
        if (highlightedIndex >= 0) handleSelect(options[highlightedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleHighlight = (index: number) => {
    if (isDisabled(options[index])) return;
    setHighlightedIndex(index);
  };

  return {
    isOpen,
    selectedOption,
    highlightedIndex,
    handleToggle,
    handleSelect,
    handleKeyDown,
    handleHighlight,
  };
}
