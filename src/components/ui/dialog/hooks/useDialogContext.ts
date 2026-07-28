import { useContext } from 'react';

import { DialogContext } from '../context/DialogContext';

/**
 * dialog 하위 네임스페이스 컴포넌트는 무조건 <Dialog> 안에서만 사용할 수 있게 강제한다.
 */
export const useDialogContext = () => {
  const context = useContext(DialogContext);

  if (context === null) {
    throw new Error('<Dialog> 하위 컴포넌트는 <Dialog> 안에서만 사용할 수 있습니다.');
  }

  return context;
};
