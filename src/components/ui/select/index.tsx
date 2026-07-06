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
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type SelectOption = {
  id: string;
  label: string;
  disabled?: boolean;
  [key: string]: unknown;
};

type SelectContextValue = {
  value: SelectOption | null;
  open: boolean;
  highlightedOptionId: string | null;
  setOpen: (open: boolean) => void;
  onValueChange: (option: SelectOption) => void;
  registerItem: (item: SelectCollectionItem) => () => void;
  selectOption: (option: SelectOption) => void;
  moveHighlight: (direction: HighlightDirection) => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);

type HighlightDirection = 1 | -1;

type SelectCollectionItem = {
  id: string;
  option: SelectOption;
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

type SelectRootProps = {
  value: SelectOption | null;
  onValueChange: (option: SelectOption) => void;
  children: ReactNode;
};

function SelectRoot({ value, onValueChange, children }: SelectRootProps) {
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

  const selectOption = useCallback(
    (option: SelectOption) => {
      if (option.disabled === true) {
        return;
      }

      onValueChange(option);
      setHighlightedOptionId(option.id);
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
        onValueChange,
        registerItem,
        selectOption,
        moveHighlight,
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

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();

  return <span>{value?.label ?? placeholder}</span>;
}

function SelectContent({ children }: { children: ReactNode }) {
  const { open } = useSelectContext();

  if (!open) {
    return null;
  }

  return <div>{children}</div>;
}

type SelectItemState = {
  option: SelectOption;
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

type SelectItemProps = {
  option: SelectOption;
  children: (state: SelectItemState) => ReactNode;
};

function SelectItem({ option, children }: SelectItemProps) {
  const { value, highlightedOptionId, registerItem, selectOption } = useSelectContext();
  const itemRef = useRef<HTMLDivElement | null>(null);

  const selected = value?.id === option.id;
  const disabled = option.disabled === true;
  const highlighted = highlightedOptionId === option.id;

  useEffect(() => {
    return registerItem({
      id: option.id,
      option,
      disabled,
      ref: itemRef,
    });
  }, [disabled, option, registerItem]);

  const handleClick = () => {
    selectOption(option);
  };

  return (
    <div ref={itemRef} onClick={handleClick}>
      {children({
        option,
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
