import { assertProducts, type Product } from "./types";

function hasProducts(value: unknown): value is { products: unknown } {
  return typeof value === "object" && value !== null && "products" in value;
}

export async function getProducts(): Promise<Product[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL이 설정되지 않았습니다.");
  }

  const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
  const json: unknown = await res.json();

  if (!hasProducts(json)) {
    throw new Error("응답에 products 필드가 없습니다.");
  }

  assertProducts(json.products);
  return json.products;
}
