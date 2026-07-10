"use client";

import { useSelect, type SelectOption } from "@/components/ui/select";

export interface SizeOption extends SelectOption {
  stock: number;
  arrivalLabel?: string;
}

interface SizeSelectProps {
  options: SizeOption[];
  value?: SizeOption | null;
  defaultValue?: SizeOption | null;
  onChange?: (option: SizeOption) => void;
}

export function SizeSelect({ options, value, defaultValue, onChange }: SizeSelectProps) {
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
        <span style={{ color: selected ? "#1a1a1a" : "#5a6675", fontWeight: selected ? 700 : 500 }}>
          {selected ? selected.label : "사이즈"}
        </span>
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
                  <div style={{ fontSize: 17, fontWeight: state.selected ? 700 : 400 }}>
                    {option.label}
                  </div>
                  {state.disabled ? (
                    <div style={{ marginTop: 6, fontSize: 14, color: "#8794a3" }}>품절</div>
                  ) : (
                    option.arrivalLabel && (
                      <div
                        style={{ marginTop: 6, fontSize: 14, color: "#2f52e0", fontWeight: 600 }}
                      >
                        🚚 {option.arrivalLabel}
                      </div>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
