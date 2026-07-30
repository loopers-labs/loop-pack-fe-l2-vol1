"use client";

import { ReactNode } from "react";

interface ToggleButtonProps {
  ariaLabel: string;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function ToggleButton({
  ariaLabel,
  isActive,
  onToggle,
  children,
}: ToggleButtonProps): React.JSX.Element {
  return (
    <button type="button" aria-label={ariaLabel} aria-pressed={isActive} onClick={onToggle}>
      {children}
    </button>
  );
}
