import styles from "./demos.module.css";

interface SelectStateProbeProps {
  selectedLabel: string | null;
  highlightedIndex: number;
  disabledIndexes: number[];
}

export function SelectStateProbe({
  selectedLabel,
  highlightedIndex,
  disabledIndexes,
}: SelectStateProbeProps) {
  // 유효 인덱스는 0부터라 음수면 "하이라이트된 옵션 없음".
  const hasHighlight = highlightedIndex >= 0;

  return (
    <dl className={styles.probe}>
      <div className={styles.probeRow}>
        <dt className={styles.probeKey}>selected</dt>
        <dd className={styles.probeValue}>{selectedLabel ?? "없음"}</dd>
      </div>
      <div className={styles.probeRow}>
        <dt className={styles.probeKey}>highlightedIndex</dt>
        <dd className={styles.probeValue}>
          {hasHighlight ? highlightedIndex : "없음"}
        </dd>
      </div>
      <div className={styles.probeRow}>
        <dt className={styles.probeKey}>disabledIndexes</dt>
        <dd className={styles.probeValue}>
          {disabledIndexes.length > 0 ? disabledIndexes.join(", ") : "없음"}
        </dd>
      </div>
    </dl>
  );
}
