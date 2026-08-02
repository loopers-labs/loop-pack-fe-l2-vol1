'use client';

import Image from 'next/image';
import { useSelect } from '@/shared/ui/select/hooks/useSelect';
import styles from './ProductOptionAccordion.module.css';

type ProductOption = {
  thumbnailUrl: string;
  name: string;
  discountPercent?: number;
  price: number;
  tag?: string;
};

type ProductOptionAccordionProps = {
  title: string;
  options: ProductOption[];
  onSelect: (option: ProductOption) => void;
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

export function ProductOptionAccordion({
  title,
  options,
  onSelect,
  defaultExpanded = false,
}: ProductOptionAccordionProps) {
  //useSelect는 id를 요구하지만 ProductOption엔 없어서 배열 인덱스를 id로 보강 (props 계약은 그대로 유지)
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
          {selected && <span className={styles.selectedSummary}>{selected.name}</span>}
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
                <Image
                  src={item.option.thumbnailUrl}
                  alt={item.option.name}
                  width={64}
                  height={64}
                  unoptimized
                  className={styles.thumbnail}
                />
                <span className={styles.rowText}>
                  <span className={styles.name}>{item.option.name}</span>
                  <span className={styles.priceLine}>
                    {item.option.discountPercent !== undefined && (
                      <span className={styles.discount}>{item.option.discountPercent}%</span>
                    )}
                    <span className={styles.price}>{formatPrice(item.option.price)}</span>
                    {item.option.tag && <span className={styles.tag}>{item.option.tag}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
