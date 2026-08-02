'use client';

import { useSelect } from '@/shared/ui/select/hooks/useSelect';
import styles from './SizeOptionAccordion.module.css';

type SizeOption = {
  label: string;
  /** 배송 안내 문구, 예: "내일(토) 도착보장" */
  deliveryLabel?: string;
};

type SizeOptionAccordionProps = {
  title: string;
  sizes: SizeOption[];
  onSelect: (option: SizeOption) => void;
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

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h11v8H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="17" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SizeOptionAccordion({
  title,
  sizes,
  onSelect,
  defaultExpanded = false,
}: SizeOptionAccordionProps) {
  //useSelect는 id를 요구하지만 SizeOption엔 없어서 배열 인덱스를 id로 보강 (props 계약은 그대로 유지)
  const augmentedSizes = sizes.map((size, index) => ({ ...size, id: index }));

  const { open, selected, items, getTriggerProps, getListboxProps, getOptionProps } = useSelect({
    options: augmentedSizes,
    defaultOpen: defaultExpanded,
    onChange: (option) => onSelect(option),
  });

  return (
    <div className={styles.card}>
      <button type="button" className={styles.header} {...getTriggerProps()}>
        <span className={styles.headerText}>
          <span className={styles.title}>{title}</span>
          {selected && <span className={styles.selectedSummary}>{selected.label}</span>}
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
                <span className={styles.label}>{item.option.label}</span>
                {item.option.deliveryLabel && (
                  <span className={styles.delivery}>
                    <TruckIcon />
                    {item.option.deliveryLabel}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
