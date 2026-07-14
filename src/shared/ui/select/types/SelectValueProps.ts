import type { ReactNode } from 'react'

import type { SelectOption } from './SelectOption'

export type SelectValueProps = {
  readonly children?: (option: SelectOption) => ReactNode
  readonly placeholder?: ReactNode
}
