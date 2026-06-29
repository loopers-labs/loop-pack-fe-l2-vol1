import { Checkbox, Label } from '@/shared/ui'

export function RemoteAreaFilterToggle({
  excludeRemoteAreas,
  setExcludeRemoteAreas,
}: {
  excludeRemoteAreas: boolean
  setExcludeRemoteAreas: (value: boolean) => void
}) {
  return (
    <Label className="mb-1 text-[13px] opacity-80">
      <Checkbox
        checked={excludeRemoteAreas}
        onChange={(e) => {
          setExcludeRemoteAreas(e.target.checked)
        }}
      />
      도서산간 제외
    </Label>
  )
}
