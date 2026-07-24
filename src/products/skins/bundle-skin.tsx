"use client";

import type { CSSProperties } from "react";
import { useSelect, type SelectOptionState } from "@/shared/ui/select";
import type { BundleOption } from "@/products/api/types";
import { formatWon } from "@/products/format";

export interface BundleSkinProps {
  options: BundleOption[];
}

const FREE_SHIPPING_LABEL = "무료배송";

function priceSummary(option: BundleOption): string {
  return `${formatWon(option.price)} · 1개당 ${formatWon(option.unitPrice)} · ${FREE_SHIPPING_LABEL}`;
}

function summarize(option: BundleOption): string {
  return `${option.label} · ${priceSummary(option)}`;
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
  flexDirection: "column",
  gap: 8,
  listStyle: "none",
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};

const priceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  fontSize: 15,
  fontWeight: 700,
};

const unitPriceStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 400,
  color: "#5a6675",
};

const badgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid #e5793a",
  color: "#e5793a",
  fontSize: 11,
};

function rowStyle(state: SelectOptionState): CSSProperties {
  if (state.disabled) {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      width: "100%",
      padding: 12,
      borderRadius: 10,
      border: "1px solid #e4e7ec",
      background: "#f4f5f7",
      color: "#c1c6d0",
      cursor: "not-allowed",
      textAlign: "left",
    };
  }

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: state.selected
      ? "1px solid #2c3475"
      : state.highlighted
        ? "1px solid #8891c9"
        : "1px solid #e4e7ec",
    background: state.selected ? "#eef0fb" : "#ffffff",
    color: "#141a2b",
    cursor: "pointer",
    textAlign: "left",
  };
}

export function BundleSkin({ options }: BundleSkinProps) {
  const select = useSelect({ options, isOptionDisabled: (option) => option.stock === 0 });
  const readout = select.selected ? priceSummary(select.selected) : "구성을 선택해 주세요";

  return (
    <div
      role="group"
      aria-label="구성 선택"
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
                style={rowStyle(state)}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{option.label}</span>
                  <span style={priceRowStyle}>
                    {formatWon(option.price)}
                    <span style={unitPriceStyle}>1개당 {formatWon(option.unitPrice)}</span>
                  </span>
                </span>
                <span style={badgeStyle}>{FREE_SHIPPING_LABEL}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
