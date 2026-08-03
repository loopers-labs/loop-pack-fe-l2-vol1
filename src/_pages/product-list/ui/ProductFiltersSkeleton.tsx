import styles from './ProductFilters.module.css'

export const ProductFiltersSkeleton = () => (
  <div className={`${styles.filters} ${styles.skeleton}`} aria-hidden="true">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className={styles.skeletonField}>
        <span className={styles.skeletonLabel} />
        <span className={styles.skeletonControl} />
      </div>
    ))}
  </div>
)
