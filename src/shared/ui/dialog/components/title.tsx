import { type ReactNode } from 'react';

type TitleProps = {
  children?: string | ReactNode;
};
export function Title({ children }: TitleProps) {
  if (children === undefined) {
    return null;
  }

  return typeof children === 'string' ? <h3>{children}</h3> : children;
}
