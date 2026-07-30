import type { ReactNode } from "react";

type PlaceholderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  role?: "status" | "alert";
};

export function Placeholder({ title, description, action, role = "status" }: PlaceholderProps) {
  return (
    <div className="week05-placeholder" role={role}>
      <p className="week05-placeholder-title">{title}</p>
      {description ? <p className="week05-placeholder-description">{description}</p> : null}
      {action}
    </div>
  );
}
