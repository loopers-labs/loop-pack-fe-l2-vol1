import styles from "./LoadingDots.module.css";

// 진행 중 표시. 장식이라 aria-hidden으로 두고, 상태 전달(로딩 중임)은 호출부가 aria-label로 남긴다.
export function LoadingDots() {
  return (
    <span className={styles.dots} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
