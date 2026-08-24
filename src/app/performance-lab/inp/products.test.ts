import { describe, expect, it } from "vitest";

describe("성능 측정용 상품 데이터", () => {
  it("성능 측정 화면에 중복 없는 상품 카드 24개를 제공한다", async () => {
    const { performanceLabProducts } = await import("./products");

    expect(performanceLabProducts).toHaveLength(24);
    expect(new Set(performanceLabProducts.map((product) => product.id)).size).toBe(24);
  });

  it("같은 입력은 같은 계산 결과를 내고 선택 상태가 바뀌면 정해진 결과가 달라진다", async () => {
    const { calculateCardPresentation } = await import("./products");

    const first = calculateCardPresentation("p1", false);
    const repeated = calculateCardPresentation("p1", false);
    const selected = calculateCardPresentation("p1", true);

    expect(first).toBe(349624);
    expect(repeated).toBe(349624);
    expect(selected).toBe(578445);
  });
});
