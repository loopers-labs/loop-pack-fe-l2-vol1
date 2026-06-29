import type { ReactNode } from 'react'

type OrderLineContentProps = {
  children: ReactNode
}

export function OrderLineContent({ children }: OrderLineContentProps) {
  return <div className="min-w-0 flex-1">{children}</div>
}
