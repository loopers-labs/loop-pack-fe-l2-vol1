'use client';

import { useSelect } from '@/shared/ui/select/hooks/useSelect';
import styles from './PriceOptionAccordion.module.css';

type PriceOption = {
  /** 굵게 표시할 대괄호 태그, 예: "최대할인" */
  tag?: string;
  name: string;
  price: number;
  /** 괄호 안에 그대로 표시할 단가 문구, 예: "1개당 2,100원" */
  unitPriceLabel: string;
  freeShipping?: boolean;
};

type PriceOptionAccordionProps = {
  title: string;
  options: PriceOption[];
  onSelect: (option: PriceOption) => void;
  defaultExpanded?: boolean;
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={styles.chevron}
      data-expanded={expanded}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`;
}

export function PriceOptionAccordion({
  title,
  options,
  onSelect,
  defaultExpanded = false,
}: PriceOptionAccordionProps) {
  //useSelect는 id를 요구하지만 PriceOption엔 없어서 배열 인덱스를 id로 보강 (props 계약은 그대로 유지)
  const augmentedOptions = options.map((option, index) => ({ ...option, id: index }));

  const { open, selected, items, getTriggerProps, getListboxProps, getOptionProps } = useSelect({
    options: augmentedOptions,
    defaultOpen: defaultExpanded,
    onChange: (option) => onSelect(option),
  });

  return (
    <div className={styles.card}>
      <button type="button" className={styles.header} {...getTriggerProps()}>
        <span className={styles.headerText}>
          <span className={styles.title}>{title}</span>
          {selected && (
            <span className={styles.selectedSummary}>
              {selected.name} · {formatPrice(selected.price)}
            </span>
          )}
        </span>
        <ChevronIcon expanded={open} />
      </button>
      {open && (
        <ul className={styles.list} {...getListboxProps()}>
          {items.map((item) => (
            <li key={item.option.id}>
              <button
                type="button"
                className={styles.row}
                data-selected={item.selected}
                data-highlighted={item.highlighted}
                {...getOptionProps(item.index)}
              >
                <span className={styles.rowText}>
                  <span className={styles.rowName}>
                    {item.option.tag && <span className={styles.tag}>[{item.option.tag}]</span>}{' '}
                    {item.option.name}
                  </span>
                  <span className={styles.rowPrice}>
                    {formatPrice(item.option.price)}
                    <span className={styles.unitPrice}> ({item.option.unitPriceLabel})</span>
                  </span>
                </span>
                {item.option.freeShipping && <span className={styles.badge}>무료배송</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
