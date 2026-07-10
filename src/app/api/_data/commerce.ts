import type { Category, CategoryId, Product } from "@/types/commerce";

export const categories: Category[] = [
  { id: "casual", name: "캐주얼" },
  { id: "fashion", name: "패션" },
  { id: "goods", name: "뷰티·잡화" },
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
  ["p1", "29CM 셀렉트", "Basic Fit Ball Cap (6color)", "casual", 39000, null, 4.8, 312, "2026-07-09T09:00:00.000Z"],
  ["p2", "29CM 셀렉트", "[Exclusive] Holiday Signature Ball Cap (20Colors)", "casual", 39000, null, 4.6, 184, "2026-07-08T09:00:00.000Z"],
  ["p3", "29CM 셀렉트", "[1+1] 베이직 무지 롱 슬리브 102-CVL 17수 긴팔티", "casual", 34000, null, 4.7, 98, "2026-07-06T09:00:00.000Z"],
  ["p4", "29CM 셀렉트", "[29Exclusive] PLAIN COTTON CASHMERE CARDIGAN (5 COLORS)", "casual", 138000, null, 4.5, 221, "2026-06-28T09:00:00.000Z"],
  ["p5", "29CM 셀렉트", "[Woman]케이블 울 니트 가디건_Ivory", "casual", 119000, null, 4.9, 410, "2026-06-25T09:00:00.000Z"],
  ["p6", "29CM 셀렉트", "WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502", "fashion", 69000, null, 4.7, 520, "2026-07-10T09:00:00.000Z"],
  ["p7", "29CM 셀렉트", "23AW Voyager Balmacaan Coat (Dark Navy)", "fashion", 428000, null, 4.5, 268, "2026-07-05T09:00:00.000Z"],
  ["p8", "29CM 셀렉트", "OG Pigment dyeing hoody 002 _ charcoal", "fashion", 89000, null, 4.8, 706, "2026-06-30T09:00:00.000Z"],
  ["p9", "29CM 셀렉트", "TD5-SH07 페이퍼셔츠 (10 Color)", "fashion", 59700, null, 4.4, 129, "2026-07-02T09:00:00.000Z"],
  ["p10", "29CM 셀렉트", "WOMAN GNRL 에센셜 가디건 [5COL] / WBC3L04503", "fashion", 85000, null, 4.6, 344, "2026-06-21T09:00:00.000Z"],
  ["p11", "29CM 셀렉트", "하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml", "goods", 48000, null, 4.9, 990, "2026-07-07T09:00:00.000Z"],
  ["p12", "29CM 셀렉트", "얼티밋 핏 롱웨어 진 쿠션", "goods", 60000, null, 4.3, 473, "2026-07-03T09:00:00.000Z"],
  ["p13", "29CM 셀렉트", "[에이핑크 남주 착용] LV039 Classic freshwater pearl necklace.", "goods", 69000, null, 4.6, 285, "2026-06-29T09:00:00.000Z"],
  ["p14", "29CM 셀렉트", "[ESSENTIAL] Silk 100% Scarf 01", "goods", 58000, null, 4.7, 611, "2026-06-18T09:00:00.000Z"],
  ["p15", "29CM 셀렉트", "Cosymosy Mini Bird Keyring - Light Gray", "goods", 26000, null, 4.8, 804, "2026-07-01T09:00:00.000Z"],
  ["p16", "29CM 셀렉트", "스탠리 클래식 런치박스", "home", 75000, null, 4.8, 418, "2026-07-04T09:00:00.000Z"],
  ["p17", "29CM 셀렉트", "[STANLEY] GO CERAMIVAC 진공 텀블러/보틀 473ml", "home", 42000, null, 4.5, 177, "2026-06-20T09:00:00.000Z"],
  ["p18", "29CM 셀렉트", "LEXON 렉슨 MINA 미니 조명 - LH60", "home", 240000, null, 4.4, 533, "2026-06-27T09:00:00.000Z"],
  ["p19", "29CM 셀렉트", "[STANLEY] 스탠리 클래식 포어 오버 커피 드리퍼 세트", "home", 65000, null, 4.2, 92, "2026-07-08T12:00:00.000Z"],
  ["p20", "29CM 셀렉트", "[STANLEY] 스탠리 클래식 진공 캠프머그 473미리", "home", 44000, null, 4.7, 364, "2026-06-24T09:00:00.000Z"],
  ["p21", "29CM 셀렉트", "메이커스 투명케이스", "digital", 23000, null, 4.9, 1230, "2026-06-26T09:00:00.000Z"],
  ["p22", "29CM 셀렉트", "카드 포켓 에어쿠션 투명 폰 케이스(아이폰 갤럭시 핸드폰)", "digital", 37600, null, 4.6, 689, "2026-07-06T12:00:00.000Z"],
  ["p23", "29CM 셀렉트", "위키오 3in1 거치대형 무선충전기 아이폰, 갤럭시, 스마트워치, 무선이어폰 동시충전", "digital", 39900, null, 4.5, 444, "2026-06-17T09:00:00.000Z"],
  ["p24", "29CM 셀렉트", "FRAME CASE Air Bumper", "digital", 25000, null, 4.7, 298, "2026-07-09T12:00:00.000Z"],
  ["p25", "29CM 셀렉트", "신지마운트 톡 탈부착 핸드폰 스마트톡 그립톡", "digital", 12900, null, 4.3, 375, "2026-06-23T09:00:00.000Z"],
  ["p26", "29CM 셀렉트", "Margaret Sweatshirt - Oatmeal", "casual", 72000, null, 4.5, 88, "2026-07-10T12:00:00.000Z"],
  ["p27", "29CM 셀렉트", "[FW23]아톰 후디 남성(6colors)", "fashion", 410000, null, 4.4, 151, "2026-07-09T15:00:00.000Z"],
  ["p28", "29CM 셀렉트", "네로 비니 블랙", "goods", 49000, null, 4.6, 207, "2026-07-08T15:00:00.000Z"],
  ["p29", "29CM 셀렉트", "WOOD GLOVES", "home", 3000, null, 4.3, 119, "2026-07-07T15:00:00.000Z"],
  ["p30", "29CM 셀렉트", "신지루프 실리콘 핸드폰 핑거스트랩", "digital", 5900, null, 4.5, 463, "2026-07-05T15:00:00.000Z"],
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
