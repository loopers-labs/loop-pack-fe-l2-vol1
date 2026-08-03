import styles from './CategorySection.module.css'

// 카테고리는 CategoryId 유니온 값 5개로 고정되어 있어 실제 개수와 항상 일치한다.
const CATEGORY_COUNT = 5

export const CategorySectionSkeleton = () => (
  <section className={styles.section} aria-hidden="true">
    <h2>카테고리</h2>
    <div className={styles.categories}>
      {Array.from({ length: CATEGORY_COUNT }, (_, index) => (
        <span key={index} className={styles.skeletonPill} />
      ))}
    </div>
  </section>
)
