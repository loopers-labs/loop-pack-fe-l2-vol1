import type { ReactNode } from 'react'

type OrderLineDescriptionProps = {
  children: ReactNode
}

export function OrderLineDescription({ children }: OrderLineDescriptionProps) {
  return (
    <small className="mt-0.5 block text-[13px] text-(--text) opacity-70">
      {children}
    </small>
  )
}
