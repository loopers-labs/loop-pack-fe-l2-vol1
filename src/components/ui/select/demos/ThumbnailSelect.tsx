// docs/images/select2.png 구현

import Image from "next/image";
import { useSelect } from "../useSelect";
import { SelectStateProbe } from "./SelectStateProbe";
import { SHOE_PRODUCTS, type ShoeProduct } from "./sampleData";
import { formatPrice } from "@/utils";
import styles from "./demos.module.css";

const shoeToKey = (product: ShoeProduct) => product.id;
const isShoeSoldOut = (product: ShoeProduct) => product.soldOut;

export function ThumbnailSelect({
  onChange,
}: {
  onChange?: (option: ShoeProduct) => void;
}) {
  const {
    isOpen,
    selectedOption,
    highlightedIndex,
    disabledIndexes,
    optionItems,
    getTriggerProps,
    getListProps,
  } = useSelect<ShoeProduct>({
    options: SHOE_PRODUCTS,
    optionToKey: shoeToKey,
    isOptionDisabled: isShoeSoldOut,
    onChange,
  });

  return (
    <div className={styles.demo}>
      <div className={`${styles.card} ${styles.cardBold}`}>
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
            {selectedOption?.name ?? "옵션을 선택해 주세요"}
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
                option: product,
                isSelected,
                isHighlighted,
                isDisabled,
                getOptionProps,
              }) => {
                const rowClass = [
                  styles.row,
                  styles.thumbRow,
                  isHighlighted && styles.highlighted,
                  isSelected && styles.selected,
                  isDisabled && styles.disabled,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li
                    key={product.id}
                    className={rowClass}
                    {...getOptionProps()}
                  >
                    <Image
                      className={styles.thumbImg}
                      src={product.image}
                      alt={product.name}
                      width={56}
                      height={56}
                    />
                    <span className={styles.thumbMeta}>
                      <span className={styles.thumbName}>{product.name}</span>
                      <span className={styles.thumbPriceLine}>
                        <span className={styles.discount}>
                          {product.discountPercent}%
                        </span>
                        <span className={styles.price}>
                          {formatPrice(product.price)}
                        </span>
                        {product.soldOut ? (
                          <span className={styles.soldOutText}>품절</span>
                        ) : (
                          <span className={styles.todayBadge}>오늘드림</span>
                        )}
                      </span>
                    </span>
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>

      <SelectStateProbe
        selectedLabel={selectedOption?.name ?? null}
        highlightedIndex={highlightedIndex}
        disabledIndexes={disabledIndexes}
      />
    </div>
  );
}
