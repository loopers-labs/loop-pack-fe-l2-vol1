'use client'

import { useSelect } from '@/hooks/useSelect'
import type { SizeSelectOption } from '@/types/product-options'
import { isSoldOut as checkIsSoldOut } from '@/utils/isSoldOut'
import { SelectToggleIcon } from './SelectToggleIcon'
import styles from './SizeOptionSelect.module.css'

const DeliveryTruckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 16"
    fill="none"
    aria-hidden
    className={styles.deliveryIcon}
  >
    <rect x="1" y="3" width="13" height="8" rx="1" fill="currentColor" />
    <path d="M14 6H18L21 9V11H14V6Z" fill="currentColor" />
    <circle cx="5" cy="12.5" r="1.5" fill="currentColor" />
    <circle cx="17" cy="12.5" r="1.5" fill="currentColor" />
  </svg>
)

type SizeOptionSelectProps = {
  title: string
  options: SizeSelectOption[]
  defaultValue?: SizeSelectOption
  onChange?: (option: SizeSelectOption | undefined) => void
}

export const SizeOptionSelect = ({
  title,
  options,
  defaultValue,
  onChange,
}: SizeOptionSelectProps) => {
  const { containerRef, isOpen, selected, items, onTriggerClick, selectIndex, onClear, onKeyDown } =
    useSelect({
      options,
      defaultValue,
      isOptionDisabled: (option) => checkIsSoldOut(option.stock),
      onChange,
    })

  return (
    <div>
      <div className={styles.container} ref={containerRef}>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={isOpen}
          onClick={onTriggerClick}
          onKeyDown={onKeyDown}
        >
          <span>{title}</span>
          <SelectToggleIcon isOpen={isOpen} />
        </button>
        {isOpen && (
          <ul className={styles.list} role="listbox">
            {items.map(({ option, selected: isSelected, highlighted, disabled }, index) => {
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={disabled}
                  className={[
                    styles.option,
                    highlighted && styles.highlighted,
                    disabled && styles.disabled,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectIndex(index)}
                >
                  <span className={styles.value}>{option.value}</span>
                  {disabled ? (
                    <span className={styles.soldOut}>품절</span>
                  ) : (
                    option.deliveryText && (
                      <span className={styles.delivery}>
                        <DeliveryTruckIcon />
                        {option.deliveryText}
                      </span>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {selected && (
        <div className={styles.selected} data-testid="selected">
          <div className={styles.selectedInfo}>
            <span className={styles.value}>{selected.value}</span>
            {checkIsSoldOut(selected.stock) ? (
              <span className={styles.soldOut}>품절</span>
            ) : (
              selected.deliveryText && (
                <span className={styles.delivery}>
                  <DeliveryTruckIcon />
                  {selected.deliveryText}
                </span>
              )
            )}
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="선택 해제"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
