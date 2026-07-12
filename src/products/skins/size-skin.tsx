"use client";

import type { CSSProperties } from "react";
import { useSelect, type SelectOptionState } from "@/shared/ui/select";
import type { SizeOption } from "@/products/api/types";

export interface SizeSkinProps {
  options: SizeOption[];
}

function summarize(option: SizeOption): string {
  return `${option.value} · ${option.deliveryText}`;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  maxWidth: 360,
  border: "1px solid #e4e7ec",
  borderRadius: 14,
  background: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
};

const readoutStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "#141a2b",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  listStyle: "none",
};

function chipStyle(state: SelectOptionState): CSSProperties {
  if (state.disabled) {
    return {
      padding: "10px 16px",
      borderRadius: 999,
      border: "1px solid #e4e7ec",
      background: "#f4f5f7",
      color: "#c1c6d0",
      textDecoration: "line-through",
      cursor: "not-allowed",
      fontSize: 13,
    };
  }

  return {
    padding: "10px 16px",
    borderRadius: 999,
    border: state.selected
      ? "1px solid #2c3475"
      : state.highlighted
        ? "1px solid #8891c9"
        : "1px solid #e4e7ec",
    background: state.selected ? "#2c3475" : "#ffffff",
    color: state.selected ? "#ffffff" : "#141a2b",
    cursor: "pointer",
    fontSize: 13,
  };
}

export function SizeSkin({ options }: SizeSkinProps) {
  const select = useSelect({ options, isOptionDisabled: (option) => option.stock === 0 });
  const readout = select.selected ? summarize(select.selected) : "사이즈를 선택해 주세요";

  return (
    <div
      role="group"
      aria-label="사이즈 선택"
      style={containerStyle}
      tabIndex={0}
      onKeyDown={select.onKeyDown}
    >
      <p style={readoutStyle}>{readout}</p>
      <ul style={listStyle}>
        {options.map((option) => {
          const state = select.getOptionState(option);
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={state.disabled}
                aria-label={summarize(option)}
                aria-pressed={state.selected}
                aria-current={state.highlighted ? "true" : undefined}
                onClick={() => select.select(option)}
                style={chipStyle(state)}
              >
                {option.value}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
