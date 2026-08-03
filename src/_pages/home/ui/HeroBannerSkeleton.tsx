import styles from './HeroBanner.module.css'

export const HeroBannerSkeleton = () => (
  <section className={`${styles.hero} ${styles.skeleton}`} aria-hidden="true">
    <span className={styles.skeletonDescription} />
    <span className={styles.skeletonTitle} />
  </section>
)
