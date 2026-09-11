import type { ReactNode } from 'react'
import styles from './NoticeBanner.module.css'

type NoticeBannerProps = {
  children: ReactNode
  role?: 'alert' | 'status'
  action?: ReactNode
  // 같은 role을 가진 요소가 문서에 여럿일 때 이 배너를 특정하기 위한 접근 가능한 이름.
  label?: string
}

export const NoticeBanner = ({ children, role = 'alert', action, label }: NoticeBannerProps) => (
  <div className={styles.banner} role={role} aria-label={label}>
    <p className={styles.message}>{children}</p>
    {action !== undefined && <div className={styles.action}>{action}</div>}
  </div>
)
