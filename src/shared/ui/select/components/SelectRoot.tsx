import { useRef } from 'react'

import { SelectContext } from '../lib/SelectContext'
import { SelectTriggerRefContext } from '../lib/SelectTriggerRefContext'
import { useSelect } from '../lib/useSelect'
import type { SelectOption, SelectRootProps } from '../types'

export function SelectRoot<TOption extends SelectOption>({
  children,
  options,
  value,
  onChange,
}: SelectRootProps<TOption>) {
  const contextValue = useSelect({ options, value, onChange })
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <SelectTriggerRefContext value={triggerRef}>
      <SelectContext value={contextValue}>{children}</SelectContext>
    </SelectTriggerRefContext>
  )
}
