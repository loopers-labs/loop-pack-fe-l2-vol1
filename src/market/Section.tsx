import type { PropsWithChildren } from "react";

type SectionProps = PropsWithChildren<{
  title: string;
}>;

export function Section({ title, children }: SectionProps) {
  return (
    <div className="section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
