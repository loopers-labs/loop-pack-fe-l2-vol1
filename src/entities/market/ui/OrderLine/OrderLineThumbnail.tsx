import type { ReactNode } from 'react'

type OrderLineThumbnailProps = {
  children: ReactNode
}

export function OrderLineThumbnail({ children }: OrderLineThumbnailProps) {
  return <span className="text-[26px]">{children}</span>
}
