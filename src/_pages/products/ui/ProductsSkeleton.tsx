import styles from './ProductsSkeleton.module.css';

// 데이터 없는 최초 진입의 pending UI — 실제 목록과 같은 그리드(week05-grid)와
// 카드 비율(이미지 1:1 + 텍스트 줄)을 그대로 차지해 목록 크기를 예상하게 하고,
// 실제 콘텐츠로 교체될 때 layout shift를 만들지 않는다.
export function ProductsSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="상품 목록 불러오는 중">
      <p className={styles.count} aria-hidden="true" />
      <div className="week05-grid">
        {Array.from({ length: count }, (_, index) => (
          <div className="week05-product" key={index} aria-hidden="true">
            <div className={styles.image} />
            <p className={styles.line + ' ' + styles.lineShort} />
            <p className={styles.line} />
            <p className={styles.line + ' ' + styles.lineShort} />
          </div>
        ))}
      </div>
    </div>
  );
}
