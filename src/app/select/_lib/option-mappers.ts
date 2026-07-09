import type { BundleProduct, SizedProduct, ThumbnailProduct } from "@/types/product";

import type { BundleOption } from "../_components/bundle-select";
import type { ItemOption } from "../_components/item-select";
import type { SizeOption } from "../_components/size-select";

// API 도메인 모델 → 각 Select의 옵션 모델로 번역하는 계층.
// 순수 함수만 있으므로 서버/클라이언트 어디서든 import할 수 있다.

export function toBundleOptions(bundles: BundleProduct[]): BundleOption[] {
  return bundles.map((b) => ({
    id: b.id,
    label: b.name,
    price: b.price,
    unitPrice: Math.round(b.price / b.unitCount),
    freeShipping: b.freeShipping,
  }));
}

export function toItemOptions(items: ThumbnailProduct[]): ItemOption[] {
  return items.map((p) => ({
    id: p.id,
    label: p.name,
    thumbnailUrl: p.image,
    price: p.price,
    discountRate: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0,
    badge: p.todayDelivery ? "오늘드림" : undefined,
  }));
}

export function toSizeOptions(product: SizedProduct): SizeOption[] {
  return product.sizes.map((s) => ({
    id: String(s.value),
    label: String(s.value),
    stock: s.stock,
    disabled: s.stock === 0,
    arrivalLabel: s.stock > 0 ? "내일(토) 도착보장" : undefined,
  }));
}
