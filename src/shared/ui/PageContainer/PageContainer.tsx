import type { ReactNode } from 'react'
import styles from './PageContainer.module.css'

type PageContainerProps = {
  children: ReactNode
}

export const PageContainer = ({ children }: PageContainerProps) => {
  return <main className={styles.container}>{children}</main>
}
