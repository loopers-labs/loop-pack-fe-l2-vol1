import { afterEach, describe, expect, it, vi } from "vitest";
import { getProducts } from "./get-products";

describe("getProducts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("MSW 인터셉트 응답에서 3개의 Product를 반환한다", async () => {
    const products = await getProducts();

    expect(products).toHaveLength(3);
  });

  it("production에서 NEXT_PUBLIC_BASE_URL이 없으면 fail-fast로 reject한다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");

    await expect(getProducts()).rejects.toThrow();
  });
});
