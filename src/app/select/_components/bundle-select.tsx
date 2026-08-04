"use client";

import { useSelect, type SelectOption } from "@/shared/ui/select";

export interface BundleOption extends SelectOption {
  price: number;
  unitPrice: number;
  freeShipping?: boolean;
}

interface BundleSelectProps {
  options: BundleOption[];
  value?: BundleOption | null;
  defaultValue?: BundleOption | null;
  onChange?: (option: BundleOption) => void;
}

export function BundleSelect({ options, value, defaultValue, onChange }: BundleSelectProps) {
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
        <span>{selected ? selected.label : "옵션 선택"}</span>
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #f0f2f5",
                  cursor: state.disabled ? "not-allowed" : "pointer",
                  background: state.highlighted ? "#f7f8fa" : "#fff",
                  opacity: state.disabled ? 0.4 : 1,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: state.selected ? 700 : 400 }}>
                    {option.label}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 15 }}>
                    <b style={{ color: "#1a1a1a" }}>{option.price.toLocaleString()}원</b>{" "}
                    <span style={{ color: "#f26b1d" }}>
                      (1개당 {option.unitPrice.toLocaleString()}원)
                    </span>
                  </div>
                </div>
                {option.freeShipping && !state.disabled && (
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 13,
                      color: "#f26b1d",
                      border: "1px solid #f26b1d",
                      fontWeight: 700,
                    }}
                  >
                    무료배송
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
