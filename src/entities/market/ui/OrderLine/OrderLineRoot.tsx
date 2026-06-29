import type { ReactNode } from 'react'

type OrderLineSlotProps = {
  children: ReactNode
}

export function OrderLineRoot({ children }: OrderLineSlotProps) {
  return <div className="flex items-center gap-2.5 py-2">{children}</div>
}
