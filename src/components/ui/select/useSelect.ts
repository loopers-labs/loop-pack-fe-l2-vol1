import { useCallback, useEffect, useRef, useState } from 'react';
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
  const toggleRef = useRef<HTMLButtonElement>(null);

  const keyOf = itemToKey ?? ((item: T) => item);

  // isOpen 상태 변경 + onIsOpenChange 콜백 호출을 한 곳에서 책임지는 헬퍼
  const updateIsOpen = useCallback(
    (next: boolean) => {
      setIsOpen((prev) => {
        if (prev === next) return prev; // 값이 같으면 스킵 (불필요한 콜백/리렌더 방지)
        onIsOpenChange?.(next);
        return next;
      });
    },
    [onIsOpenChange]
  );

  // 드롭다운이 열리면 포커스를 <ul>로 이동
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  // 외부 클릭 감지: 메뉴나 토글 버튼 바깥을 클릭하면 닫는다.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target;
      // 클릭한 곳이 메뉴 또는 토글 버튼 내부면 닫지 않는다.
      if (
        target instanceof Node &&
        (menuRef.current?.contains(target) || toggleRef.current?.contains(target))
      ) {
        return;
      }
      updateIsOpen(false);
      setHighlightedIndex(-1);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, updateIsOpen]);

  const selectItem = (item: T) => {
    if (isItemDisabled?.(item)) return;
    setSelectedItem(item);
    updateIsOpen(false);
    onSelectedItemChange?.(item);
  };

  const getToggleButtonProps = () => ({
    ref: toggleRef,
    onClick: () => {
      updateIsOpen(!isOpen);
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
          e.preventDefault(); // 스크롤을 막기 위해 기본 동작 방지
          break;
        case 'ArrowUp':
          setHighlightedIndex((prev) => {
            for (let i = prev - 1; i >= 0; i--) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return prev;
          });
          e.preventDefault();
          break;
        case 'Enter':
          selectItem(items[highlightedIndex]);
          break;
        case 'Escape':
          updateIsOpen(false); // ← 헬퍼 사용
          setHighlightedIndex(-1);
          break;
        default:
          e.stopPropagation();
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
