type ResetFiltersButtonProps = {
  readonly onResetFilters: () => void
}

export function ResetFiltersButton({
  onResetFilters,
}: ResetFiltersButtonProps) {
  return (
    <button
      type="button"
      className="ml-auto cursor-pointer rounded-md border border-[#ddd] bg-white px-4 py-2 text-[13px]"
      onClick={onResetFilters}
    >
      필터 초기화
    </button>
  )
}
