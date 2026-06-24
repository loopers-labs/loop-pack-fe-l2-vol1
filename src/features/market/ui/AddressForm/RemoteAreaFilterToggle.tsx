export function RemortAreaFilterToggle({
  onlyNear,
  setOnlyNear,
}: {
  onlyNear: boolean
  setOnlyNear: (value: boolean) => void
}) {
  return (
    <label className="mb-1 flex items-center gap-2 py-1 text-[13px] opacity-80">
      <input
        type="checkbox"
        checked={onlyNear}
        onChange={(e) => {
          setOnlyNear(e.target.checked)
        }}
      />
      도서산간 제외
    </label>
  )
}
