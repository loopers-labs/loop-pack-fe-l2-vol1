"use client";

import { useSelect, type SelectOption } from "@/shared/ui/select";
import Image from "next/image";

export interface ItemOption extends SelectOption {
  thumbnailUrl: string;
  discountRate: number;
  price: number;
  badge?: string; // "오늘드림"
}

interface ItemSelectProps {
  options: ItemOption[];
  value?: ItemOption | null;
  defaultValue?: ItemOption | null;
  onChange?: (option: ItemOption) => void;
}

export function ItemSelect({ options, value, defaultValue, onChange }: ItemSelectProps) {
  const {
    isOpen,
    value: selected,
    rootRef,
    getToggleProps,
    getOptionProps,
    getOptionState,
  } = useSelect({
    options,
    value,
    defaultValue,
    onChange,
  });

  return (
    <div
      ref={rootRef}
      style={{ border: "1px solid #e2e6eb", borderRadius: 12, background: "#fff" }}
    >
      <button
        type="button"
        {...getToggleProps()}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        <span>{selected ? selected.label : "옵션을 선택해 주세요"}</span>
        <span aria-hidden>{isOpen ? "︿" : "﹀"}</span>
      </button>

      {isOpen && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {options.map((option, index) => {
            const state = getOptionState(option, index);
            return (
              <li
                key={option.id}
                {...getOptionProps(option, index)}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #f0f2f5",
                  cursor: state.disabled ? "not-allowed" : "pointer",
                  background: state.highlighted ? "#f7f8fa" : "#fff",
                  opacity: state.disabled ? 0.4 : 1,
                }}
              >
                <Image
                  src={option.thumbnailUrl}
                  alt={option.label}
                  width={64}
                  height={64}
                  style={{ borderRadius: 8, border: "1px solid #f0f2f5", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: state.selected ? 700 : 400 }}>
                    {option.label}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 15,
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <b style={{ color: "#e8590c" }}>{option.discountRate}%</b>
                    <b>{option.price.toLocaleString()}원</b>
                    {option.badge && !state.disabled && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "#fdeef3",
                          color: "#d6336c",
                          fontWeight: 700,
                        }}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
