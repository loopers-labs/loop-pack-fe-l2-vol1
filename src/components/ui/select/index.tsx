"use client";
import { useState } from "react";

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

type UseSelectParams<Item> = {
  items: Item[];
  itemToString: (item: Item | null) => string;
  selectedItem?: Item | null;
  defaultSelectedItem?: Item | null;
  onSelectedItemChange?: (item: Item) => void;
};

type UseSelectReturn<Item> = {
  isOpen: boolean;
  selectedItem: Item | null;
  highlightedIndex: number;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectItem: (item: Item) => void;
};

export function useSelect<Item>({
  selectedItem,
  defaultSelectedItem = null,
  onSelectedItemChange,
}: UseSelectParams<Item>): UseSelectReturn<Item> {
  const isControlled = selectedItem !== undefined;
  const [internalSelectedItem, setInternalSelectedItem] = useState<Item | null>(
    defaultSelectedItem,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex] = useState(-1);

  const currentSelectedItem = isControlled ? selectedItem : internalSelectedItem;

  const openMenu = () => {
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const selectItem = (item: Item) => {
    if (!isControlled) {
      setInternalSelectedItem(item);
    }

    onSelectedItemChange?.(item);
    closeMenu();
  };

  return {
    isOpen,
    selectedItem: currentSelectedItem ?? null,
    highlightedIndex,
    openMenu,
    closeMenu,
    toggleMenu,
    selectItem,
  };
}
