type WishlistActionButtonProps = {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function WishlistActionButton({
  label,
  pressed,
  disabled,
  onClick,
}: WishlistActionButtonProps) {
  return (
    <button
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-base leading-none font-semibold text-gds-gray-700 shadow-[0_1px_4px_rgba(0,0,0,0.12)] ring-1 ring-black/5 hover:bg-white hover:text-gds-red-500 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:bg-white aria-pressed:text-gds-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <span aria-hidden>{pressed ? "♥" : "♡"}</span>
      <span className="sr-only">{pressed ? "찜 해제" : "찜"}</span>
    </button>
  );
}
