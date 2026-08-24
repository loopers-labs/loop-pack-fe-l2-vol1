import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

describe("HeroSection", () => {
  test("renders the existing banner contract as a stable hero", async () => {
    const { HeroSection } = await import("./HeroSection");

    const markup = renderToStaticMarkup(
      <HeroSection
        title="매일 새롭게 발견하는 취향"
        description="지금 가장 사랑받는 상품을 만나보세요."
      />,
    );

    expect(markup).toContain("매일 새롭게 발견하는 취향");
    expect(markup).toContain("지금 가장 사랑받는 상품을 만나보세요.");
    expect(markup).toContain("/_next/image");
    expect(markup).toContain("hero-original");
  });
});
