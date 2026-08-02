import { type ReactNode } from 'react';
import { useSelectContext } from '../hooks/useSelectContext';

type TriggerProps = {
  children?: ReactNode;
};

export function Trigger({ children }: TriggerProps) {
  const { getTriggerProps } = useSelectContext();

  return (
    <button type="button" className="select-trigger" {...getTriggerProps()}>
      {children}
    </button>
  );
}
