import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface UseSelectProps<T extends SelectOption> {
  options: T[];
  value: T | null;
  onChange: (option: T) => void;
}

export function useSelect<T extends SelectOption>({ options, value, onChange }: UseSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const findEnabledIndex = (from: number, delta: 1 | -1): number => {
    for (let i = from; i >= 0 && i < options.length; i += delta) {
      if (!options[i].disabled) return i;
    }
    return -1;
  };

  const open = () => {
    const selectedIndex = value ? options.findIndex((o) => o.id === value.id) : -1;
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findEnabledIndex(0, 1));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectOption = (option: T) => {
    if (option.disabled) return;
    onChange(option);
    close();
  };

  const moveHighlight = (delta: 1 | -1) => {
    const next = findEnabledIndex(highlightedIndex + delta, delta);
    if (next !== -1) setHighlightedIndex(next);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (isOpen) moveHighlight(1);
        else open();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) moveHighlight(-1);
        else open();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isOpen) open();
        else if (highlightedIndex >= 0) selectOption(options[highlightedIndex]);
        break;
      case "Escape":
        close();
        break;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const getToggleProps = () => ({
    tabIndex: 0,
    onClick: () => (isOpen ? close() : open()),
    onKeyDown: handleTriggerKeyDown,
  });

  const getOptionProps = (option: T, index: number) => ({
    onClick: () => selectOption(option),
    onMouseEnter: () => {
      if (!option.disabled) setHighlightedIndex(index);
    },
  });

  const getOptionState = (option: T, index: number) => ({
    selected: value !== null && value.id === option.id,
    highlighted: index === highlightedIndex,
    disabled: option.disabled === true,
  });

  return {
    isOpen,
    highlightedIndex,
    rootRef,
    getToggleProps,
    getOptionProps,
    getOptionState,
  };
}
