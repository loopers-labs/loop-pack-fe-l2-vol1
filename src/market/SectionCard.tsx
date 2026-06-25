import type { ReactNode } from 'react';

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, action, children }: Props) {
  return (
    <div className="section">
      {title ? (
        <div className="row between">
          <h2>{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
