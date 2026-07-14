import type { ReactNode } from 'react'

import type { SelectOption } from './SelectOption'

export type SelectRootProps<TOption extends SelectOption> = {
  readonly children: ReactNode
  readonly options: ReadonlyArray<TOption>
  readonly value: TOption | null
  readonly onChange: (option: TOption) => void
}
