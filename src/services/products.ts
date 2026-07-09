import type { ProductCatalog } from "@/types/product";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function getCatalog(): Promise<ProductCatalog> {
  const res = await fetch(`${BASE_URL}/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("상품 옵션을 불러오지 못했습니다");
  return (await res.json()) as ProductCatalog;
}
