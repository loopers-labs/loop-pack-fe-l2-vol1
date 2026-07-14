// docs/images/select3.png 구현

import { type ReactNode } from "react";
import { useSelect } from "../useSelect";
import { SelectStateProbe } from "./SelectStateProbe";
import { BAGEL_PACKS, type BagelPack } from "./sampleData";
import { formatPrice, perUnitPrice } from "@/utils";
import styles from "./demos.module.css";

function renderTextTrailing(pack: BagelPack): ReactNode {
  if (pack.soldOut) return <span className={styles.soldOutText}>품절</span>;

  if (pack.freeShipping)
    return <span className={styles.shipPill}>무료배송</span>;

  return null;
}

const bagelToKey = (pack: BagelPack) => pack.id;
const isBagelSoldOut = (pack: BagelPack) => pack.soldOut;

export function TextSelect({
  onChange,
}: {
  onChange?: (option: BagelPack) => void;
}) {
  const {
    isOpen,
    selectedOption,
    highlightedIndex,
    disabledIndexes,
    optionItems,
    getTriggerProps,
    getListProps,
  } = useSelect<BagelPack>({
    options: BAGEL_PACKS,
    optionToKey: bagelToKey,
    isOptionDisabled: isBagelSoldOut,
    onChange,
  });

  return (
    <div className={styles.demo}>
      <div className={styles.card}>
        <button
          type="button"
          className={`${styles.header} ${isOpen ? `${styles.headerMuted} ${styles.headerOpen}` : ""}`}
          {...getTriggerProps()}
        >
          <span
            className={
              selectedOption ? styles.headerValue : styles.headerPlaceholder
            }
          >
            {selectedOption?.label ?? "옵션 선택"}
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
                option: pack,
                isSelected,
                isHighlighted,
                isDisabled,
                getOptionProps,
              }) => {
                const rowClass = [
                  styles.row,
                  styles.textRow,
                  isHighlighted && styles.highlighted,
                  isSelected && styles.selected,
                  isDisabled && styles.disabled,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li key={pack.id} className={rowClass} {...getOptionProps()}>
                    <span className={styles.textMain}>
                      <span className={styles.textTitle}>{pack.label}</span>
                      <span className={styles.priceLine}>
                        <span className={styles.price}>
                          {formatPrice(pack.totalPrice)}
                        </span>
                        <span className={styles.perUnit}>
                          (1개당{" "}
                          {formatPrice(
                            perUnitPrice(pack.totalPrice, pack.quantity),
                          )}
                          )
                        </span>
                      </span>
                    </span>
                    {renderTextTrailing(pack)}
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>

      <SelectStateProbe
        selectedLabel={selectedOption?.label ?? null}
        highlightedIndex={highlightedIndex}
        disabledIndexes={disabledIndexes}
      />
    </div>
  );
}
