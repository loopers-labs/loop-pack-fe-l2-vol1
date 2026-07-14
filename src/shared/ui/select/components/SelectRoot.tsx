import { SelectContext } from '../lib/SelectContext'
import { useSelect } from '../lib/useSelect'
import type { SelectOption, SelectRootProps } from '../types'

export function SelectRoot<TOption extends SelectOption>({
  children,
  options,
  value,
  onChange,
}: SelectRootProps<TOption>) {
  const contextValue = useSelect({ options, value, onChange })

  return <SelectContext value={contextValue}>{children}</SelectContext>
}
