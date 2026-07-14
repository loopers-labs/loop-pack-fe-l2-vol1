// controlled 증명용: open·selectedOption이 부모에 있고, select 트리거와 바깥의 "리모컨"
// 양쪽에서 조작해도 서로 반영되는 양방향을 보여준다.

import { useState } from "react";
import { useSelect } from "../useSelect";
import { SizeSelectView } from "./SizeSelectView";
import { SIZE_OPTIONS, type SizeOption } from "./sampleData";
import styles from "./demos.module.css";

const sizeToKey = (option: SizeOption) => option.id;
const isSizeSoldOut = (option: SizeOption) => option.soldOut;

export function ControlledSelect({
  onChange,
}: {
  onChange?: (option: SizeOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SizeOption | null>(null);

  const handleSelectChange = (option: SizeOption) => {
    setSelectedOption(option);
    onChange?.(option);
  };

  const select = useSelect<SizeOption>({
    options: SIZE_OPTIONS,
    optionToKey: sizeToKey,
    isOptionDisabled: isSizeSoldOut,
    selectedOption,
    open: isOpen,
    onChange: handleSelectChange,
    onOpenChange: setIsOpen,
  });

  return (
    <div className={styles.demo}>
      <div className={styles.remote} {...select.getBoundaryProps()}>
        <button
          type="button"
          className={styles.remoteButton}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? "리스트 닫기" : "리스트 열기"}
        </button>

        <div className={styles.remoteButtons}>
          {SIZE_OPTIONS.map((option) => {
            const isActive = selectedOption?.id === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={option.soldOut}
                className={`${styles.remoteButton} ${isActive ? styles.remoteButtonActive : ""}`}
                onClick={() => handleSelectChange(option)}
              >
                {option.size}
              </button>
            );
          })}
        </div>

        <dl className={styles.probe}>
          <div className={styles.probeRow}>
            <dt className={styles.probeKey}>open</dt>
            <dd className={styles.probeValue}>{String(isOpen)}</dd>
          </div>
          <div className={styles.probeRow}>
            <dt className={styles.probeKey}>selectedOption</dt>
            <dd className={styles.probeValue}>
              {selectedOption?.size ?? "없음"}
            </dd>
          </div>
        </dl>
      </div>

      <SizeSelectView {...select} />
    </div>
  );
}
