import type { ComponentProps } from 'react'

import { textControl } from './formStyles'

type InputProps = ComponentProps<'input'>

export function Input({ className, ...inputProps }: InputProps) {
  return <input {...inputProps} className={textControl({ className })} />
}
