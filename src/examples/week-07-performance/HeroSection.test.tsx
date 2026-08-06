import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

describe("HeroSection", () => {
  it("optimizes the hero image while keeping the banner contract", async () => {
    const { HeroSection } = await import("./HeroSection");

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    );

    expect(markup).toContain("매일 새롭게 발견하는 취향");
    expect(markup).toContain("지금 가장 사랑받는 상품을 만나보세요.");
    // 원본을 소스로 하되 next/image 최적화 파이프라인을 거친다.
    expect(markup).toContain("/_next/image");
    expect(markup).toContain("hero-original.jpg");
    // 표시폭(<=1200px)에 맞춘 후보를 고르도록 sizes를 준다 — 과대 이미지 방지.
    expect(markup).toContain("(min-width: 1232px) 1200px, 100vw");
    // LCP 요소라 preload로 일찍 발견되고 lazy로 미뤄지지 않아야 한다.
    expect(markup).toContain('rel="preload"');
    expect(markup).not.toContain('loading="lazy"');
  });
});
