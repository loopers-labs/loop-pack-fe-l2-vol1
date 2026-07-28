function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? '' : 'rotate-180'}`}
    >
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

export default Chevron;
