"use client";

import { useState } from "react";

import type { ProductCatalog } from "@/types/product";

import { toBundleOptions, toItemOptions, toSizeOptions } from "../_lib/option-mappers";
import { BundleSelect, type BundleOption } from "./bundle-select";
import { ItemSelect, type ItemOption } from "./item-select";
import { SizeSelect, type SizeOption } from "./size-select";

export function ProductOptions({ catalog }: { catalog: ProductCatalog }) {
  const [bundle, setBundle] = useState<BundleOption | null>(null);
  const [size, setSize] = useState<SizeOption | null>(null);
  const [item, setItem] = useState<ItemOption | null>(null);

  const bundleOptions = toBundleOptions(catalog.bundles);
  const sizeOptions = toSizeOptions(catalog.sneakers);
  const itemOptions = toItemOptions(catalog.ampoules);

  const total = (bundle?.price ?? 0) + (item?.price ?? 0);

  return (
    <>
      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>① 텍스트 옵션 — 베이글</h2>
        <BundleSelect options={bundleOptions} value={bundle} onChange={setBundle} />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>② 사이즈 옵션 — {catalog.sneakers.name}</h2>
        <SizeSelect options={sizeOptions} value={size} onChange={setSize} />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>③ 썸네일 옵션 — 앰플</h2>
        <ItemSelect options={itemOptions} value={item} onChange={setItem} />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>
          ④ uncontrolled — 페이지는 선택 상태를 모른다 (defaultValue만 전달)
        </h2>
        <BundleSelect options={bundleOptions} defaultValue={bundleOptions[0] ?? null} />
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 12,
          background: "#f7f8fa",
          display: "grid",
          gap: 6,
          fontSize: 15,
        }}
      >
        <div>
          베이글:{" "}
          {bundle
            ? `${bundle.label} — ${bundle.price.toLocaleString()}원 (1개당 ${bundle.unitPrice.toLocaleString()}원)`
            : "미선택"}
        </div>
        <div>
          사이즈: {size ? `${size.label} (재고 ${size.stock}개)` : "미선택"}
          {size?.arrivalLabel && ` · ${size.arrivalLabel}`}
        </div>
        <div>
          앰플:{" "}
          {item
            ? `${item.label} — ${item.discountRate}% ${item.price.toLocaleString()}원`
            : "미선택"}
        </div>
        <b style={{ fontSize: 18, marginTop: 6 }}>합계 {total.toLocaleString()}원</b>
      </section>
    </>
  );
}
