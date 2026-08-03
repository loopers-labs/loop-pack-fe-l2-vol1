import { useEffect } from 'react';

import { autoUpdate, flip, shift, useFloating } from '@floating-ui/react';

import type { BaseSelectOption } from '../types';
import { type UseSelectProps, useSelect } from './useSelect';

/**
 * 직접 만든 `useSelect` 훅을 그대로 사용하여 인프라만 얹는 useSelectFloating 훅입니다.
 * - `@floating-ui/react` 라이브러리를 사용하였습니다.
 */
export const useSelectFloating = <T extends BaseSelectOption>(props: UseSelectProps<T>) => {
  const select = useSelect(props);

  /**
   * flip api를 사용하여 브라우저 사이즈를 초과하는 포지션일 때 위아래 전환이 되도록 하였습니다.
   * @see https://floating-ui.com/docs/flip
   */
  const { refs, floatingStyles, placement } = useFloating({
    open: select.isOpen,
    placement: 'bottom-start',
    middleware: [flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  /**
   * 리스트가 활성화 되었을 때, 다른 곳에 마우스 클릭이 들어갔을 때의 동작을 `pointerdown` 이벤트와 동기화하는 effect 훅 입니다.
   */
  useEffect(() => {
    if (!select.isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      const trigger = refs.domReference.current;
      const menu = refs.floating.current;

      const clickedInside = target instanceof Node && (trigger?.contains(target) || menu?.contains(target));

      if (clickedInside) return;

      select.close();
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [select, refs]);

  return {
    ...select,
    placement,
    getToggleProps: () => ({ ...select.getToggleProps(), ref: refs.setReference }),
    getListboxProps: () => ({
      ref: refs.setFloating,
      style: floatingStyles,
    }),
  };
};
