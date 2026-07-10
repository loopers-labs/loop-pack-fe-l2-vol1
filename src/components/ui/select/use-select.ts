import { useRef, useState, type KeyboardEvent, type RefObject } from "react";

import { useControllableState } from "../internal/use-controllable-state";
import { useOutsideClick } from "../internal/use-outside-click";

export interface SelectOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface UseSelectProps<T extends SelectOption> {
  options: T[];
  value?: T | null;
  defaultValue?: T | null;
  onChange?: (option: T) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SelectToggleProps {
  tabIndex: number;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  "data-state": "open" | "closed";
}

interface SelectOptionProps {
  onClick: () => void;
  onMouseEnter: () => void;
  "data-selected": "" | undefined;
  "data-highlighted": "" | undefined;
  "data-disabled": "" | undefined;
}

interface SelectOptionState {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}

interface UseSelectReturn<T extends SelectOption> {
  isOpen: boolean;
  value: T | null;
  highlightedIndex: number;
  rootRef: RefObject<HTMLDivElement | null>;
  getToggleProps: () => SelectToggleProps;
  getOptionProps: (option: T, index: number) => SelectOptionProps;
  getOptionState: (option: T, index: number) => SelectOptionState;
}

export function useSelect<T extends SelectOption>({
  options,
  value: controlledValue,
  defaultValue = null,
  onChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: UseSelectProps<T>): UseSelectReturn<T> {
  const [value, setValue] = useControllableState<T | null>({
    value: controlledValue,
    defaultValue,
    onChange: (next) => {
      if (next !== null) onChange?.(next);
    },
  });

  const [isOpen, setIsOpen] = useControllableState({
    value: controlledOpen,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

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
    setValue(option);
    close();
  };

  const moveHighlight = (delta: 1 | -1) => {
    const next = findEnabledIndex(highlightedIndex + delta, delta);
    if (next !== -1) setHighlightedIndex(next);
  };

  const jumpHighlight = (edge: "start" | "end") => {
    const next =
      edge === "start" ? findEnabledIndex(0, 1) : findEnabledIndex(options.length - 1, -1);
    if (next !== -1) setHighlightedIndex(next);
  };

  const handleTriggerKeyDown = (e: KeyboardEvent) => {
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
      case "Home":
        if (isOpen) {
          e.preventDefault();
          jumpHighlight("start");
        }
        break;
      case "End":
        if (isOpen) {
          e.preventDefault();
          jumpHighlight("end");
        }
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

  useOutsideClick(rootRef, close, isOpen);

  const getToggleProps = (): SelectToggleProps => ({
    tabIndex: 0,
    onClick: () => (isOpen ? close() : open()),
    onKeyDown: handleTriggerKeyDown,
    "data-state": isOpen ? "open" : "closed",
  });

  const getOptionProps = (option: T, index: number): SelectOptionProps => ({
    onClick: () => selectOption(option),
    onMouseEnter: () => {
      if (!option.disabled) setHighlightedIndex(index);
    },
    "data-selected": value !== null && value.id === option.id ? "" : undefined,
    "data-highlighted": index === highlightedIndex ? "" : undefined,
    "data-disabled": option.disabled === true ? "" : undefined,
  });

  const getOptionState = (option: T, index: number): SelectOptionState => ({
    selected: value !== null && value.id === option.id,
    highlighted: index === highlightedIndex,
    disabled: option.disabled === true,
  });

  return {
    isOpen,
    value,
    highlightedIndex,
    rootRef,
    getToggleProps,
    getOptionProps,
    getOptionState,
  };
}
