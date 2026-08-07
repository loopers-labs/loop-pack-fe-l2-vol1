import styles from './HeroSection.module.css'

// 실제 카피와 같은 .copy 박스를 쓴다. .copy는 .hero 안에서 position: absolute이므로
// 내용이 바뀌어도 아래 콘텐츠를 밀지 않는다.
export const HeroCopySkeleton = () => (
  <div className={`${styles.copy} ${styles.skeleton}`} aria-hidden="true">
    <span className={styles.skeletonEyebrow} />
    <span className={styles.skeletonTitle} />
    <span className={styles.skeletonDescription} />
  </div>
)
