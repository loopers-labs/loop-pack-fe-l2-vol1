import { useSelectContext } from '../lib/SelectContext'
import type { SelectValueProps } from '../types'

export function SelectValue({
  children,
  placeholder = null,
}: SelectValueProps) {
  const select = useSelectContext('Value')
  let content = placeholder

  if (select.selectedOption !== null) {
    content = select.selectedOption.label
  }

  if (select.selectedOption !== null && children !== undefined) {
    content = children(select.selectedOption) ?? null
  }

  return <>{content}</>
}
