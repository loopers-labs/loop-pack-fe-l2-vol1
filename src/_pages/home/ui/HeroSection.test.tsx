import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("HeroSection", () => {
  it("renders the existing banner contract as a stable hero", async () => {
    const { HeroSection } = await import("./HeroSection");

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    );

    expect(markup).toContain("매일 새롭게 발견하는 취향");
    expect(markup).toContain("지금 가장 사랑받는 상품을 만나보세요.");
    expect(markup).toContain('<h1 id="week07-hero-title">매일 새롭게 발견하는 취향</h1>');
    expect(markup).toContain(
      '<source media="(max-width: 640px)" srcSet="/images/week-07/hero-mobile-768.webp"/>',
    );
    expect(markup).toContain('src="/images/week-07/hero-1600.webp"');
    expect(markup).toContain('fetchPriority="high"');
    expect(markup).toContain('width="1600"');
    expect(markup).toContain('height="900"');
  });
});
