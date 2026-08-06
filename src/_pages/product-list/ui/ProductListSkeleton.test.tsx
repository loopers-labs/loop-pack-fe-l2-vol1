import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("ProductListSkeleton", () => {
  it("실제 목록과 같은 수의 카드 자리를 미리 잡는다", async () => {
    const { ProductListSkeleton } = await import("./ProductListSkeleton");

    const markup = renderToStaticMarkup(<ProductListSkeleton />);
    const cards = markup.match(/shop-product-skeleton/g) ?? [];

    // API 기본 pageSize와 같은 12개 — 교체될 때 아래 콘텐츠가 밀리지 않아야 한다.
    expect(cards).toHaveLength(12);
    // 같은 그리드에 들어가야 자리가 맞는다.
    expect(markup).toContain('class="shop-grid"');
    // 자리표시자는 보조기술에 읽히지 않는다.
    expect(markup).toContain('aria-hidden="true"');
  });
});
