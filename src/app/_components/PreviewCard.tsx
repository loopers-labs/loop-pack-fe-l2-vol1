import type { ReactNode } from 'react'
import styles from './PreviewCard.module.css'

type PreviewCardProps = {
  title: string
  description: string
  children: ReactNode
}

/*
 * 랜딩 페이지에서 "실제로 동작하는지" 빠르게 확인하기 위한 카드라, 문서화용 usage 코드
 * 블록 없이 제목/설명/실제 컴포넌트만 보여준다.
 */
export const PreviewCard = ({ title, description, children }: PreviewCardProps) => (
  <div className={styles.card}>
    <div className={styles.header}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
    <div className={styles.content}>{children}</div>
  </div>
)
