import type { ComponentProps } from 'react'

import { choiceControl } from './formStyles'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'>

export function Checkbox({ className, ...checkboxProps }: CheckboxProps) {
  return (
    <input
      {...checkboxProps}
      className={choiceControl({ className })}
      type="checkbox"
    />
  )
}
