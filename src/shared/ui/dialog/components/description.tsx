import { type ReactNode } from 'react';

type DescriptionProps = {
  children?: string | ReactNode;
};

export function Description({ children }: DescriptionProps) {
  if (children === undefined) {
    return null;
  }

  return typeof children === 'string' ? <p>{children}</p> : children;
}
