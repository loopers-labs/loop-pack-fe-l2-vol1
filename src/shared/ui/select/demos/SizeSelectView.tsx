// docs/images/select1.png 구현하는 SizeSelect(uncontrolled)와 ControlledSelect(controlled)가 공유한다.

import { SelectStateProbe } from "./SelectStateProbe";
import { type SizeOption } from "./sampleData";
import { type UseSelectReturn } from "../useSelect";
import styles from "./demos.module.css";

export function SizeSelectView({
  isOpen,
  selectedOption,
  highlightedIndex,
  disabledIndexes,
  optionItems,
  getTriggerProps,
  getListProps,
}: UseSelectReturn<SizeOption>) {
  return (
    <div className={styles.demo}>
      <div className={styles.card}>
        <button
          type="button"
          className={`${styles.header} ${isOpen ? styles.headerOpen : ""}`}
          {...getTriggerProps()}
        >
          <span
            className={
              selectedOption ? styles.headerValue : styles.headerPlaceholder
            }
          >
            {selectedOption?.size ?? "사이즈"}
          </span>
          <span
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          >
            ▾
          </span>
        </button>

        {isOpen && (
          <ul className={styles.list} {...getListProps()}>
            {optionItems.map(
              ({
                option,
                isSelected,
                isHighlighted,
                isDisabled,
                getOptionProps,
              }) => {
                const rowClass = [
                  styles.row,
                  styles.sizeRow,
                  isHighlighted && styles.highlighted,
                  isSelected && styles.selected,
                  isDisabled && styles.disabled,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li
                    key={option.id}
                    className={rowClass}
                    {...getOptionProps()}
                  >
                    <span className={styles.sizeNumber}>{option.size}</span>
                    {option.soldOut ? (
                      <span className={styles.soldOutText}>품절</span>
                    ) : (
                      <span className={styles.deliveryBadge}>
                        🚚 내일(토) 도착보장
                      </span>
                    )}
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>

      <SelectStateProbe
        selectedLabel={selectedOption ? String(selectedOption.size) : null}
        highlightedIndex={highlightedIndex}
        disabledIndexes={disabledIndexes}
      />
    </div>
  );
}
