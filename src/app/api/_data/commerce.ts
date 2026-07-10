import type { Category, CategoryId, Product } from "@/types/commerce";

export const categories: Category[] = [
  { id: "food", name: "푸드" },
  { id: "fashion", name: "패션" },
  { id: "beauty", name: "뷰티" },
  { id: "home", name: "홈" },
  { id: "digital", name: "디지털" },
];

export const homeBanner = {
  title: "매일 새롭게 발견하는 취향",
  description: "지금 가장 사랑받는 상품을 만나보세요.",
  image: "/images/products/p6.jpg",
};

type ProductSeed = readonly [
  id: string,
  brand: string,
  name: string,
  category: CategoryId,
  price: number,
  originalPrice: number | null,
  rating: number,
  reviewCount: number,
  createdAt: string,
];

const seeds: ProductSeed[] = [
  ["p1", "루프베이크", "베이글 플레인", "food", 3200, 4000, 4.8, 312, "2026-07-09T09:00:00.000Z"],
  ["p2", "루프베이크", "에브리씽 베이글", "food", 3800, null, 4.6, 184, "2026-07-08T09:00:00.000Z"],
  ["p3", "오후의식탁", "바질 토마토 스프레드", "food", 12900, 15900, 4.7, 98, "2026-07-06T09:00:00.000Z"],
  ["p4", "밀크앤허니", "그래놀라 허니넛", "food", 8900, null, 4.5, 221, "2026-06-28T09:00:00.000Z"],
  ["p5", "소일", "콜드브루 원액", "food", 16000, 19000, 4.9, 410, "2026-06-25T09:00:00.000Z"],
  ["p6", "데일리무드", "오버핏 코튼 셔츠", "fashion", 59000, 79000, 4.7, 520, "2026-07-10T09:00:00.000Z"],
  ["p7", "모노워크", "와이드 데님 팬츠", "fashion", 69000, null, 4.5, 268, "2026-07-05T09:00:00.000Z"],
  ["p8", "아카이브", "미니멀 레더 백", "fashion", 119000, 149000, 4.8, 706, "2026-06-30T09:00:00.000Z"],
  ["p9", "선데이클럽", "리넨 카디건", "fashion", 78000, null, 4.4, 129, "2026-07-02T09:00:00.000Z"],
  ["p10", "워크룸", "클래식 러너 스니커즈", "fashion", 139000, 169000, 4.6, 344, "2026-06-21T09:00:00.000Z"],
  ["p11", "브리즈랩", "수분 진정 세럼", "beauty", 28000, 35000, 4.9, 990, "2026-07-07T09:00:00.000Z"],
  ["p12", "누드톤", "벨벳 립 틴트", "beauty", 19000, null, 4.3, 473, "2026-07-03T09:00:00.000Z"],
  ["p13", "오브제", "퍼퓸 핸드크림", "beauty", 17000, 22000, 4.6, 285, "2026-06-29T09:00:00.000Z"],
  ["p14", "퓨어데이", "약산성 클렌징 젤", "beauty", 24000, null, 4.7, 611, "2026-06-18T09:00:00.000Z"],
  ["p15", "레이어", "데일리 선크림", "beauty", 26000, 32000, 4.8, 804, "2026-07-01T09:00:00.000Z"],
  ["p16", "스테이홈", "워셔블 코튼 베딩", "home", 129000, 159000, 4.8, 418, "2026-07-04T09:00:00.000Z"],
  ["p17", "우드앤", "오크 사이드 테이블", "home", 189000, null, 4.5, 177, "2026-06-20T09:00:00.000Z"],
  ["p18", "룸센트", "시더우드 디퓨저", "home", 39000, 49000, 4.4, 533, "2026-06-27T09:00:00.000Z"],
  ["p19", "소프트룸", "라운드 쿠션 세트", "home", 45000, null, 4.2, 92, "2026-07-08T12:00:00.000Z"],
  ["p20", "키친노트", "내열 유리컵 4P", "home", 32000, 42000, 4.7, 364, "2026-06-24T09:00:00.000Z"],
  ["p21", "플로우", "무선 노이즈캔슬링 헤드폰", "digital", 289000, 349000, 4.9, 1230, "2026-06-26T09:00:00.000Z"],
  ["p22", "키랩", "미니 기계식 키보드", "digital", 149000, null, 4.6, 689, "2026-07-06T12:00:00.000Z"],
  ["p23", "오디오룸", "블루투스 스피커", "digital", 99000, 129000, 4.5, 444, "2026-06-17T09:00:00.000Z"],
  ["p24", "픽셀", "4K 포터블 모니터", "digital", 329000, null, 4.7, 298, "2026-07-09T12:00:00.000Z"],
  ["p25", "차지온", "3-in-1 충전 스탠드", "digital", 79000, 99000, 4.3, 375, "2026-06-23T09:00:00.000Z"],
  ["p26", "루프베이크", "시나몬 크림 베이글", "food", 4500, null, 4.5, 88, "2026-07-10T12:00:00.000Z"],
  ["p27", "데일리무드", "라이트 윈드 재킷", "fashion", 89000, 119000, 4.4, 151, "2026-07-09T15:00:00.000Z"],
  ["p28", "브리즈랩", "시카 토너 패드", "beauty", 22000, 29000, 4.6, 207, "2026-07-08T15:00:00.000Z"],
  ["p29", "스테이홈", "모듈 수납 바스켓", "home", 27000, null, 4.3, 119, "2026-07-07T15:00:00.000Z"],
  ["p30", "플로우", "무선 마우스", "digital", 59000, 69000, 4.5, 463, "2026-07-05T15:00:00.000Z"],
];

const sizeOptions = [
  { value: 24, stock: 3 },
  { value: 25, stock: 0 },
  { value: 26, stock: 12 },
  { value: 27, stock: 5 },
  { value: 28, stock: 0 },
];

export const products: Product[] = seeds.map(
  ([id, brand, name, category, price, originalPrice, rating, reviewCount, createdAt]) => {
    const product: Product = {
      id,
      brand,
      name,
      category,
      price,
      originalPrice,
      image: `/images/products/${id}.jpg`,
      freeShipping: price >= 50000,
      sizes: category === "fashion" ? sizeOptions : [],
      rating,
      reviewCount,
      createdAt,
    };

    if (id === "p1") {
      return { ...product, freeShipping: true, sizes: sizeOptions };
    }

    if (id === "p2") {
      return { ...product, freeShipping: false, sizes: [] };
    }

    return product;
  },
);

const mockDelayMs = process.env.NODE_ENV === "test" ? 0 : 500;

export const waitForMockApi = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, mockDelayMs);
  });
