import result from "./ProductListResult.module.css";
import styles from "./ProductListSkeleton.module.css";

const SKELETON_CARD_COUNT = 12;

export function ProductListSkeleton() {
  return (
    <div aria-hidden>
      <p className={result.resultCount}>
        <span className={styles.countBar} />
      </p>
      <div className={styles.grid}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.image} />
            <div className={styles.brand} />
            <div className={styles.name} />
            <div className={styles.price} />
            <div className={styles.actions} />
          </div>
        ))}
      </div>
      <div className={styles.pagination} />
    </div>
  );
}
