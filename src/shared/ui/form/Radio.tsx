import type { ComponentProps } from 'react'

import { choiceControl } from './formStyles'

type RadioProps = Omit<ComponentProps<'input'>, 'type'>

export function Radio({ className, ...radioProps }: RadioProps) {
  return (
    <input
      {...radioProps}
      className={choiceControl({ className })}
      type="radio"
    />
  )
}
