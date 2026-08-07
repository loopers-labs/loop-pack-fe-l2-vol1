import type { JSX } from 'react'
import styles from './HeroSection.module.css'

// 실제 문구(eyebrow·제목·설명 2줄)와 같은 높이를 예약해 교체 시 hero 박스가 흔들리지 않게 한다.
export function HeroCopyFallback(): JSX.Element {
  return (
    <div className={styles.copySkeleton} aria-hidden="true">
      <div className={`${styles.skeletonLine} ${styles.skeletonEyebrow}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
    </div>
  )
}
