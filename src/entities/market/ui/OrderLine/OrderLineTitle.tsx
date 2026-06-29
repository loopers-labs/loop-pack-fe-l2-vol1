import type { ReactNode } from 'react'

type OrderLineTitleProps = {
  children: ReactNode
}

export function OrderLineTitle({ children }: OrderLineTitleProps) {
  return <span className="text-(--text)">{children}</span>
}
