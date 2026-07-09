import { useEffect, useRef, useState } from 'react';
import { UseSelectOptions, UseSelectReturn } from './types';

export const useSelect = <T>({
  items,
  isItemDisabled,
  itemToKey,
  initialSelectedItem,
  onSelectedItemChange,
  onIsOpenChange,
}: UseSelectOptions<T>): UseSelectReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(initialSelectedItem ?? null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLUListElement>(null);

  const keyOf = itemToKey ?? ((item: T) => item);

  // isOpen 상태 변경 + onIsOpenChange 콜백 호출을 한 곳에서 책임지는 헬퍼.
  // setIsOpen을 직접 쓰면 콜백을 까먹기 쉬워서, 모든 변경 경로를 이 함수로 통일.
  const updateIsOpen = (next: boolean) => {
    setIsOpen((prev) => {
      if (prev === next) return prev; // 값이 같으면 스킵 (불필요한 콜백/리렌더 방지)
      onIsOpenChange?.(next);
      return next;
    });
  };

  // 드롭다운이 열리면 포커스를 <ul>로 이동
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  const selectItem = (item: T) => {
    if (isItemDisabled?.(item)) return;
    setSelectedItem(item);
    updateIsOpen(false); // ← setIsOpen 대신 사용 (onIsOpenChange 자동 호출)
    onSelectedItemChange?.(item);
  };

  const getToggleButtonProps = () => ({
    onClick: () => {
      updateIsOpen(!isOpen); // ← 토글도 헬퍼로 (값이 바뀔 때만 콜백)
    },
  });

  const getMenuProps = () => ({
    role: 'listbox',
    tabIndex: -1,
    ref: menuRef,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          setHighlightedIndex((prev) => {
            // 이동 가능한 index 찾기
            for (let i = prev + 1; i < items.length; i++) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return prev;
          });
          break;
        case 'ArrowUp':
          setHighlightedIndex((prev) => {
            for (let i = prev - 1; i >= 0; i--) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return prev;
          });
          break;
        case 'Enter':
          selectItem(items[highlightedIndex]);
          break;
        case 'Escape':
          updateIsOpen(false); // ← 헬퍼 사용
          setHighlightedIndex(-1);
          break;
      }
    },
  });

  const getItemProps = ({ item, index }: { item: T; index: number }) => ({
    role: 'option',
    'aria-selected': selectedItem ? keyOf(item) === keyOf(selectedItem) : false,
    'aria-disabled': isItemDisabled?.(item) ?? false,
    onClick: () => selectItem(item),
    onMouseEnter: () => setHighlightedIndex(index),
    disabled: isItemDisabled?.(item) ?? false,
  });

  return {
    isOpen,
    selectedItem,
    highlightedIndex,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  };
};
