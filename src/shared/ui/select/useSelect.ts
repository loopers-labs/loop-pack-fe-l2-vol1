import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/shared/lib/useIsomorphicLayoutEffect';
import { UseSelectOptions, UseSelectReturn } from './types';

export const useSelect = <T>({
  items,
  isItemDisabled,
  itemToKey,
  selectedItem: selectedItemProp,
  initialSelectedItem,
  onSelectedItemChange,
  isOpen: isOpenProp,
  defaultIsOpen,
  onIsOpenChange,
}: UseSelectOptions<T>): UseSelectReturn<T> => {
  // ── open: controlled/uncontrolled 이중 API ───────────────────────
  // isOpen prop 이 넘어오면 controlled, 아니면 internal state(uncontrolled).
  // 판별/위임 방식은 Dialog 와 동일하게 통일했다.
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(defaultIsOpen ?? false);
  const isOpenControlled = isOpenProp !== undefined;
  const isOpen = isOpenControlled ? isOpenProp : internalIsOpen;

  // ── selection: controlled/uncontrolled 이중 API ──────────────────
  const [internalSelectedItem, setInternalSelectedItem] = useState<T | null>(
    initialSelectedItem ?? null
  );
  const selectedItemControlled = selectedItemProp !== undefined;
  const selectedItem = (selectedItemControlled ? selectedItemProp : internalSelectedItem) ?? null;

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // 인스턴스별 고유 id. 페이지 내에 셀렉트가 여러 개 있어도
  // aria-activedescendant / aria-controls가 서로 충돌하지 않게 한다. (AI 활용)
  const uid = useId();
  const menuId = `${uid}-menu`;
  const getOptionId = useCallback((index: number) => `${uid}-option-${index}`, [uid]);

  // keyOf: T 가 객체면 itemToKey 가 필수이고, 원시값이면 항등 함수.
  // === 비교에만 쓰이므로 반환 타입은 추론에 맡긴다(string|number|T 합집합).
  const keyOf = useCallback((item: T) => (itemToKey ? itemToKey(item) : item), [itemToKey]);

  // ── open 상태 위임 헬퍼 ──
  // controlled 면 onIsOpenChange 만 호출(부모가 상태 소유),
  // uncontrolled 면 내부 상태도 함께 갱신. Dialog 의 setOpen 과 동일 구조.
  const updateIsOpen = useCallback(
    (next: boolean) => {
      onIsOpenChange?.(next);
      if (!isOpenControlled) {
        setInternalIsOpen((prev) => (prev === next ? prev : next));
      }
    },
    [isOpenControlled, onIsOpenChange]
  );

  // ── selection 상태 위임 헬퍼 ──
  const updateSelectedItem = useCallback(
    (item: T | null) => {
      onSelectedItemChange?.(item);
      if (!selectedItemControlled) setInternalSelectedItem(item);
    },
    [selectedItemControlled, onSelectedItemChange]
  );

  // 드롭다운이 열릴 때: 포커스를 <ul>로 이동 + 하이라이트 초기화.
  //   - 선택값이 있고 활성이면 → 그 인덱스를 하이라이트
  //   - 그 외 → 첫 번째 활성 옵션
  // 닫힐 때는 하이라이트를 -1 로 리셋.
  // ⚠ 의존성에 items/selectedItem/keyOf 를 포함하면 open 중에도 재계산되므로,
  //   "열림 전환 시점" 에만 실행하도록 isOpen 만 바라본다 (exhaustive-deps 의도적 제외).
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    menuRef.current?.focus();

    if (selectedItem !== null) {
      const selectedIdx = items.findIndex((it) => keyOf(it) === keyOf(selectedItem));
      if (selectedIdx >= 0 && !isItemDisabled?.(items[selectedIdx])) {
        setHighlightedIndex(selectedIdx);
        return;
      }
    }
    const firstEnabled = items.findIndex((it) => !isItemDisabled?.(it));
    setHighlightedIndex(firstEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── 스크롤 보정 (핵심) ──
  // <ul> 이 고정 높이(maxHeight)로 내부 스크롤을 가질 때,
  // 키보드로 이동한 하이라이트 <li> 가 가시 영역 밖이면 scrollTop 을 맞춘다.
  // paint 이전에 DOM 을 보정해 깜빡임을 없애기 위해 isomorphic layout effect 사용.
  // (getBoundingClientRect 로 메뉴/옵션의 가시 위치를 직접 계산 → scrollIntoView 의
  //  부모 스크롤 전파 부작용을 피한다.)
  useIsomorphicLayoutEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const menu = menuRef.current;
    if (!menu) return;
    const optionEl = document.getElementById(getOptionId(highlightedIndex));
    if (!(optionEl instanceof HTMLElement)) return;

    const menuRect = menu.getBoundingClientRect();
    const optionRect = optionEl.getBoundingClientRect();

    if (optionRect.bottom > menuRect.bottom) {
      // 옵션이 아래로 삐져나감 → 아래로 스크롤
      menu.scrollTop += optionRect.bottom - menuRect.bottom;
    } else if (optionRect.top < menuRect.top) {
      // 옵션이 위로 삐져나감 → 위로 스크롤
      menu.scrollTop -= menuRect.top - optionRect.top;
    }
  }, [highlightedIndex, isOpen, getOptionId]);

  // 외부 클릭 감지: 메뉴나 토글 버튼 바깥을 클릭하면 닫는다.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target;
      if (
        target instanceof Node &&
        (menuRef.current?.contains(target) || toggleRef.current?.contains(target))
      ) {
        return;
      }
      updateIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, updateIsOpen]);

  const selectItem = (item: T) => {
    if (isItemDisabled?.(item)) return;

    const isSame = selectedItem !== null && keyOf(item) === keyOf(selectedItem);
    if (isSame) {
      updateIsOpen(false); // 같은 항목이면 그냥 닫기만
      return;
    }

    updateSelectedItem(item);
    updateIsOpen(false);
  };

  const getToggleButtonProps = () => ({
    ref: toggleRef,
    'aria-haspopup': 'listbox' as const,
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined, // 닫혀있으면 연관 관계 제거
    onClick: () => {
      updateIsOpen(!isOpen);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      // 닫힌 상태에서 ArrowDown/ArrowUp 으로 메뉴를 연다.
      // (Enter/Space 는 버튼 기본동작(click) 으로 이미 열리고,
      //  하이라이트 초기화는 open effect 가 담당한다.)
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        updateIsOpen(true);
      }
    },
  });

  const getMenuProps = () => ({
    id: menuId,
    role: 'listbox',
    tabIndex: -1,
    ref: menuRef,
    'aria-activedescendant': highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowDown':
          setHighlightedIndex((prev) => {
            for (let i = prev + 1; i < items.length; i++) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return prev;
          });
          e.preventDefault(); // 페이지 스크롤 방지
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
        case 'Home': // 첫 번째 활성 옵션으로
          e.preventDefault();
          setHighlightedIndex(() => {
            for (let i = 0; i < items.length; i++) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return -1;
          });
          break;
        case 'End': // 마지막 활성 옵션으로
          e.preventDefault();
          setHighlightedIndex(() => {
            for (let i = items.length - 1; i >= 0; i--) {
              if (!isItemDisabled?.(items[i])) return i;
            }
            return -1;
          });
          break;
        case 'Enter':
        case ' ': // Space 도 하이라이트 항목 선택
          e.preventDefault();
          if (highlightedIndex >= 0) selectItem(items[highlightedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          updateIsOpen(false);
          toggleRef.current?.focus(); // Esc 를 눌러도 바로 selectbox 로 포커스 복귀
          break;
      }
    },
  });

  const getItemProps = ({ item, index }: { item: T; index: number }) => ({
    id: getOptionId(index),
    role: 'option',
    'aria-selected': selectedItem !== null && keyOf(item) === keyOf(selectedItem),
    'aria-disabled': isItemDisabled?.(item) ?? false,
    onClick: () => selectItem(item),
    onMouseEnter: () => {
      if (isItemDisabled?.(item)) return;
      setHighlightedIndex(index);
    },
    disabled: isItemDisabled?.(item) ?? false,
    isSelected: selectedItem !== null && keyOf(item) === keyOf(selectedItem),
    isHighlighted: index === highlightedIndex,
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
