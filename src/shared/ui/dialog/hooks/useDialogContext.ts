import { useContext } from 'react';
import { DialogContext } from '../context/context';

export function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('<Dialog> 안에서만 사용 가능');

  return ctx;
}
