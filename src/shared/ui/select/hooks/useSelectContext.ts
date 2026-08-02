import { useContext } from 'react';
import { SelectContext } from '../context/context';

export function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('<Select> 안에서만 사용 가능');

  return ctx;
}
