"use client";
// Select (Headless) — 4주차 1단계
//
// 여기에 직접 만든다. 인터페이스(로직을 어떻게 노출할지)는 스스로 설계한다.
// 요구사항 요약 (자세한 건 docs/assignments/week-04.md):
//   - 라이브러리/네이티브 <select> 없이 <div>/<ul> listbox로 직접 구현
//   - value는 문자열이 아니라 옵션 "객체 전체"
//   - 같은 로직으로 옵션 UI 3종(텍스트/썸네일/사이즈)을 렌더
//   - 키보드로 열기·이동(↑↓)·선택(Enter)·닫기(Esc)
//   - 품절 옵션은 키보드 이동에서 건너뛴다
//   - 각 옵션의 selected / highlighted / disabled 를 사용처가 알 수 있게 노출
//
// 아래는 import가 깨지지 않게 둔 placeholder다. 자유롭게 갈아엎어도 된다.
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

type SelectBy<Option> = keyof Option | ((left: Option, right: Option) => boolean);

type SelectContextValue = {
  value: unknown | null;
  open: boolean;
  highlightedOptionId: string | null;
  setOpen: (open: boolean) => void;
  registerItem: (item: SelectCollectionItem) => () => void;
  selectOption: (option: unknown) => void;
  moveHighlight: (direction: HighlightDirection) => void;
  isSelected: (option: unknown) => boolean;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type HighlightDirection = 1 | -1;

type SelectCollectionItem = {
  id: string;
  option: unknown;
  disabled: boolean;
  ref: RefObject<HTMLDivElement | null>;
};

function useSelectContext() {
  const context = useContext(SelectContext);

  if (context === null) {
    throw new Error("Select components must be used within Select.Root");
  }

  return context;
}

type SelectRootProps<Option> = {
  value: Option | null;
  onValueChange: (option: Option) => void;
  by?: SelectBy<Option>;
  children: ReactNode;
};

function SelectRoot<Option>({ value, onValueChange, by, children }: SelectRootProps<Option>) {
  const [open, setOpen] = useState(false);
  const [highlightedOptionId, setHighlightedOptionId] = useState<string | null>(null);
  const collectionRef = useRef<SelectCollectionItem[]>([]);

  const registerItem = useCallback((item: SelectCollectionItem) => {
    collectionRef.current = [...collectionRef.current, item];

    return () => {
      collectionRef.current = collectionRef.current.filter((registeredItem) => {
        return registeredItem.id !== item.id;
      });
    };
  }, []);

  const isSelected = useCallback(
    (option: unknown) => {
      return isSameOption(value ?? null, option, by);
    },
    [by, value],
  );

  const selectOption = useCallback(
    (option: unknown) => {
      onValueChange(option as Option);
      setOpen(false);
    },
    [onValueChange],
  );

  const moveHighlight = useCallback(
    (direction: HighlightDirection) => {
      const enabledItems = collectionRef.current.filter((item) => !item.disabled);

      if (enabledItems.length === 0) {
        return;
      }

      const currentIndex = enabledItems.findIndex((item) => item.id === highlightedOptionId);
      const nextIndex = getNextHighlightIndex(currentIndex, direction, enabledItems.length);
      const nextItem = enabledItems[nextIndex];

      setHighlightedOptionId(nextItem.id);
      nextItem.ref.current?.scrollIntoView({ block: "nearest" });
    },
    [highlightedOptionId],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      const highlightedItem = collectionRef.current.find((item) => {
        return item.id === highlightedOptionId;
      });

      if (highlightedItem) {
        event.preventDefault();
        selectOption(highlightedItem.option);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        open,
        highlightedOptionId,
        setOpen,
        registerItem,
        selectOption,
        moveHighlight,
        isSelected,
      }}
    >
      <div className="relative" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ children }: { children: ReactNode }) {
  const { open, setOpen } = useSelectContext();

  return (
    <button type="button" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

function SelectValue({ children, placeholder }: { children?: ReactNode; placeholder?: string }) {
  return <span>{children ?? placeholder}</span>;
}

function SelectContent({ children }: { children: ReactNode }) {
  const { open } = useSelectContext();

  if (!open) {
    return null;
  }

  return <div>{children}</div>;
}

type SelectItemState<Option> = {
  option: Option;
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

type SelectItemProps<Option> = {
  value: Option;
  disabled?: boolean;
  children: (state: SelectItemState<Option>) => ReactNode;
};

function SelectItem<Option>({ value, disabled = false, children }: SelectItemProps<Option>) {
  const { highlightedOptionId, isSelected, registerItem, selectOption } = useSelectContext();
  const itemRef = useRef<HTMLDivElement | null>(null);
  const itemId = useId();

  const selected = isSelected(value);
  const highlighted = highlightedOptionId === itemId;

  useEffect(() => {
    return registerItem({
      id: itemId,
      option: value,
      disabled,
      ref: itemRef,
    });
  }, [disabled, itemId, registerItem, value]);

  const handleClick = () => {
    if (disabled) {
      return;
    }

    selectOption(value);
  };

  return (
    <div ref={itemRef} onClick={handleClick}>
      {children({
        option: value,
        selected,
        highlighted,
        disabled,
      })}
    </div>
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
};

function getNextHighlightIndex(
  currentIndex: number,
  direction: HighlightDirection,
  itemCount: number,
) {
  if (currentIndex === -1) {
    if (direction === 1) {
      return 0;
    }

    return itemCount - 1;
  }

  return (currentIndex + direction + itemCount) % itemCount;
}

function isSameOption<Option>(
  left: Option | null,
  right: unknown,
  by: SelectBy<Option> | undefined,
) {
  if (left === null || left === undefined || right === null || right === undefined) {
    return false;
  }

  if (typeof by === "function") {
    return by(left, right as Option);
  }

  if (by !== undefined) {
    return left[by] === (right as Option)[by];
  }

  return Object.is(left, right);
}
