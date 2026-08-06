import type { Metadata } from "next";

// 공통 Open Graph. Next는 페이지 openGraph를 shallow merge해 루트 openGraph를 통째로 덮으므로,
// 루트·페이지가 이 객체를 spread로 재사용해 siteName·locale·type과 fallback image를 유지한다.
// 페이지는 title·description·images만 덮어쓴다.
export const COMMON_OPEN_GRAPH = {
  siteName: "Loopers",
  locale: "ko_KR",
  type: "website",
  images: ["/images/products/p1.jpg"],
} satisfies NonNullable<Metadata["openGraph"]>;

// 페이지 metadata를 공통 형태로 조립한다. title·description을 top-level과 openGraph에 함께 넣고,
// openGraph는 공통 값(siteName·locale·type·fallback image) 위에 덮어 shallow merge로 공통 필드가 사라지지 않게 한다.
// image를 주면 그것으로, 없으면 공통 fallback image가 유지된다. 조회할 데이터·문구 구성은 각 페이지가 맡는다.
export function buildPageMetadata({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  // 페이지의 정규 URL. og:url과 canonical에 함께 넣는다. metadataBase가 상대경로를 절대 URL로 올린다.
  url?: string;
}): Metadata {
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      ...COMMON_OPEN_GRAPH,
      title,
      description,
      ...(url ? { url } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}
