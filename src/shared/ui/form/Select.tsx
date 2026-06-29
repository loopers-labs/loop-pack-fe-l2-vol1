import type { ComponentProps } from 'react'

import { textControl } from './formStyles'

type SelectProps = ComponentProps<'select'>

export function Select({ className, ...selectProps }: SelectProps) {
  return <select {...selectProps} className={textControl({ className })} />
}
