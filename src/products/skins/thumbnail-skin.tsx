"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useSelect, type SelectOptionState } from "@/shared/ui/select";
import type { ThumbnailOption } from "@/products/api/types";
import { formatWon } from "@/products/format";

export interface ThumbnailSkinProps {
  options: ThumbnailOption[];
}

function priceSummary(option: ThumbnailOption): string {
  const parts = [formatWon(option.price)];
  if (option.discountRate > 0) {
    parts.push(`${option.discountRate}%`);
  }
  parts.push(option.shippingBadge);
  return parts.join(" · ");
}

function summarize(option: ThumbnailOption): string {
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

const imageStyle: CSSProperties = {
  borderRadius: 8,
  objectFit: "cover",
  flexShrink: 0,
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};

const priceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  fontSize: 13,
};

const discountStyle: CSSProperties = {
  color: "#e0453f",
  fontWeight: 700,
};

const badgeStyle: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid #e4e7ec",
  color: "#5a6675",
  fontSize: 11,
};

function rowStyle(state: SelectOptionState): CSSProperties {
  if (state.disabled) {
    return {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: 10,
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
    gap: 12,
    width: "100%",
    padding: 10,
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

export function ThumbnailSkin({ options }: ThumbnailSkinProps) {
  const select = useSelect({ options, isOptionDisabled: (option) => option.stock === 0 });
  const readout = select.selected ? priceSummary(select.selected) : "옵션을 선택해 주세요";

  return (
    <div
      role="group"
      aria-label="옵션 선택"
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
                <Image src={option.thumbnail} alt="" width={48} height={48} style={imageStyle} />
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={labelStyle}>{option.label}</span>
                  <span style={priceRowStyle}>
                    {option.discountRate > 0 && (
                      <span style={discountStyle}>{option.discountRate}%</span>
                    )}
                    <span>{formatWon(option.price)}</span>
                    <span style={badgeStyle}>{option.shippingBadge}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
