import { Label } from '@/shared/ui'

export function RemoteAreaFilterToggle({
  onlyNear,
  setOnlyNear,
}: {
  onlyNear: boolean
  setOnlyNear: (value: boolean) => void
}) {
  return (
    <Label className="mb-1 text-[13px] opacity-80">
      <input
        type="checkbox"
        checked={onlyNear}
        onChange={(e) => {
          setOnlyNear(e.target.checked)
        }}
      />
      도서산간 제외
    </Label>
  )
}
