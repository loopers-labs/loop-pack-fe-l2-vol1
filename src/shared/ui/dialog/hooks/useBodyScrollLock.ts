import { useEffect } from 'react';

import type { DialogContextValue } from '../context/DialogContext';

/**
 * 열림 상태일 때, body에 overflow: hidden 스타일 속성을 부여하여 스크롤을 없앴습니다.
 */
export const useBodyScrollLock = ({ isOpen }: Pick<DialogContextValue, 'isOpen'>) => {
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    body.style.setProperty('overflow', 'hidden');

    return () => {
      body.style.setProperty('overflow', 'auto');
    };
  }, [isOpen]);
};
