type CartActionButtonProps = {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function CartActionButton({ label, pressed, disabled, onClick }: CartActionButtonProps) {
  return (
    <button
      className="mt-0.5 inline-flex h-8 w-full cursor-pointer items-center justify-center rounded-gds-sm border border-gds-gray-300 bg-white px-3 text-xs font-semibold text-gds-gray-900 hover:border-gds-green-500 hover:text-gds-green-700 disabled:cursor-not-allowed disabled:border-gds-gray-200 disabled:text-gds-gray-500 aria-pressed:border-gds-green-500 aria-pressed:bg-gds-green-50 aria-pressed:text-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {pressed ? "빼기" : "담기"}
    </button>
  );
}
