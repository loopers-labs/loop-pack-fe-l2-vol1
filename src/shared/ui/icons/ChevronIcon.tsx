interface ChevronIconProps {
  isOpen: boolean;
}

export function ChevronIcon({ isOpen }: ChevronIconProps) {
  return (
    <svg
      className={`size-5 shrink-0 text-text-caption transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}
