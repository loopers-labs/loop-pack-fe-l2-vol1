import { describe, expect, it } from "vitest";
import { buildHomeMetadata } from "./homeMetadata";
import { commerceOpenGraph } from "@/shared/metadata/commerceMetadata";
import type { HomeResponse } from "../api/homeApi";

const homeData: HomeResponse = {
  banner: {
    title: "매일 새롭게 발견하는 취향",
    description: "지금 가장 사랑받는 상품을 만나보세요.",
    image: "/images/week-07/hero-1600.webp",
  },
  categories: [],
  popularProducts: [],
  newProducts: [],
};

describe("buildHomeMetadata", () => {
  it("홈 API banner 응답으로 title, description, Open Graph를 만든다", () => {
    expect(buildHomeMetadata(homeData)).toEqual({
      title: homeData.banner.title,
      description: homeData.banner.description,
      openGraph: {
        ...commerceOpenGraph,
        title: homeData.banner.title,
        description: homeData.banner.description,
        images: [{ url: homeData.banner.image, alt: homeData.banner.title }],
      },
    });
  });
});
