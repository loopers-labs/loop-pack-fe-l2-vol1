import gridStyles from '@/components/ui/productGrid/ProductGrid.module.css'
import styles from './ProductGridSkeleton.module.css'

type ProductGridSkeletonProps = {
  count?: number
}

// 최초 로드(isPending)에서 보여줄 뼈대. 그리드 레이아웃은 ProductGrid와 동일하게 맞춰 깜빡임을 줄인다.
// 장식용 placeholder라 스크린리더에는 숨기고(aria-hidden), 위치가 곧 식별자인 정적 목록이라 index를 key로 쓴다.
export const ProductGridSkeleton = ({ count = 12 }: ProductGridSkeletonProps) => {
  return (
    <div className={gridStyles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.image} />
          <div className={styles.line} />
          <div className={`${styles.line} ${styles.short}`} />
        </div>
      ))}
    </div>
  )
}
