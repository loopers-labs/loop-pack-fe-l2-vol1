/**
 * 임시 mock fetch — `/api/products`를 가로채 in-memory 데이터로 응답한다.
 *
 * ⚠️ 이 파일은 스타터 scaffolding 입니다. week-03 과제 중에는 건드리지 마세요.
 *    (실제 백엔드 대신 fetch 응답을 흉내내기 위한 용도)
 */

type MockProduct = {
  id: number;
  name: string;
  category: "electronics" | "fashion" | "home" | "beauty";
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

const NOW = Date.now();
const DAY = 1000 * 60 * 60 * 24;

const PRODUCTS: MockProduct[] = [
  {
    id: 1,
    name: "무선 노이즈캔슬링 헤드폰",
    category: "electronics",
    price: 289000,
    originalPrice: 389000,
    stock: 12,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Headphone",
    createdAt: new Date(NOW - 2 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 1842,
  },
  {
    id: 2,
    name: "메커니컬 키보드 87키",
    category: "electronics",
    price: 165000,
    stock: 3,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Keyboard",
    createdAt: new Date(NOW - 30 * DAY).toISOString(),
    rating: 4.5,
    reviewCount: 932,
  },
  {
    id: 3,
    name: "스마트워치 5세대",
    category: "electronics",
    price: 419000,
    originalPrice: 499000,
    stock: 0,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Watch",
    createdAt: new Date(NOW - 60 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 2104,
  },
  {
    id: 4,
    name: "미니멀 백팩 25L",
    category: "fashion",
    price: 89000,
    originalPrice: 119000,
    stock: 24,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Backpack",
    createdAt: new Date(NOW - 5 * DAY).toISOString(),
    rating: 4.3,
    reviewCount: 412,
  },
  {
    id: 5,
    name: "러닝 스니커즈",
    category: "fashion",
    price: 142000,
    stock: 8,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Sneakers",
    createdAt: new Date(NOW - 14 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 687,
  },
  {
    id: 6,
    name: "울 코트 오버사이즈",
    category: "fashion",
    price: 329000,
    originalPrice: 459000,
    stock: 5,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Coat",
    createdAt: new Date(NOW - 90 * DAY).toISOString(),
    rating: 4.2,
    reviewCount: 154,
  },
  {
    id: 7,
    name: "데님 셔츠",
    category: "fashion",
    price: 59000,
    stock: 32,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Shirt",
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
    rating: 4.1,
    reviewCount: 89,
  },
  {
    id: 8,
    name: "캔들 워머 램프",
    category: "home",
    price: 78000,
    stock: 17,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Candle",
    createdAt: new Date(NOW - 45 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 521,
  },
  {
    id: 9,
    name: "리넨 침구 세트",
    category: "home",
    price: 159000,
    originalPrice: 199000,
    stock: 6,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Bedding",
    createdAt: new Date(NOW - 20 * DAY).toISOString(),
    rating: 4.5,
    reviewCount: 743,
  },
  {
    id: 10,
    name: "원목 사이드 테이블",
    category: "home",
    price: 219000,
    stock: 2,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Table",
    createdAt: new Date(NOW - 100 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 312,
  },
  {
    id: 11,
    name: "아로마 디퓨저",
    category: "home",
    price: 45000,
    originalPrice: 65000,
    stock: 41,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Diffuser",
    createdAt: new Date(NOW - 7 * DAY).toISOString(),
    rating: 4.3,
    reviewCount: 1023,
  },
  {
    id: 12,
    name: "비건 립밤 3종",
    category: "beauty",
    price: 28000,
    stock: 55,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Lipbalm",
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
    rating: 4.2,
    reviewCount: 234,
  },
  {
    id: 13,
    name: "비타민 C 세럼 30ml",
    category: "beauty",
    price: 52000,
    originalPrice: 78000,
    stock: 19,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Serum",
    createdAt: new Date(NOW - 11 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 2891,
  },
  {
    id: 14,
    name: "클렌징 오일",
    category: "beauty",
    price: 38000,
    stock: 0,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Cleanser",
    createdAt: new Date(NOW - 70 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 645,
  },
  {
    id: 15,
    name: "선크림 SPF50+",
    category: "beauty",
    price: 32000,
    originalPrice: 42000,
    stock: 4,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Suncream",
    createdAt: new Date(NOW - 15 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 1502,
  },
  {
    id: 16,
    name: "블루투스 스피커",
    category: "electronics",
    price: 99000,
    stock: 22,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Speaker",
    createdAt: new Date(NOW - 25 * DAY).toISOString(),
    rating: 4.3,
    reviewCount: 478,
  },
  {
    id: 17,
    name: "게이밍 마우스",
    category: "electronics",
    price: 79000,
    originalPrice: 109000,
    stock: 14,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Mouse",
    createdAt: new Date(NOW - 6 * DAY).toISOString(),
    rating: 4.5,
    reviewCount: 821,
  },
  {
    id: 18,
    name: "캐시미어 머플러",
    category: "fashion",
    price: 119000,
    stock: 1,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Muffler",
    createdAt: new Date(NOW - 80 * DAY).toISOString(),
    rating: 4.0,
    reviewCount: 67,
  },
  {
    id: 19,
    name: "캠핑 의자",
    category: "home",
    price: 89000,
    originalPrice: 119000,
    stock: 9,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Chair",
    createdAt: new Date(NOW - 40 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 396,
  },
  {
    id: 20,
    name: "바디로션 500ml",
    category: "beauty",
    price: 24000,
    stock: 67,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Lotion",
    createdAt: new Date(NOW - 4 * DAY).toISOString(),
    rating: 4.1,
    reviewCount: 156,
  },
  {
    id: 21,
    name: "4K 모니터 27인치",
    category: "electronics",
    price: 449000,
    originalPrice: 599000,
    stock: 7,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Monitor",
    createdAt: new Date(NOW - 18 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 1284,
  },
  {
    id: 22,
    name: "와이드 슬랙스",
    category: "fashion",
    price: 79000,
    stock: 28,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Pants",
    createdAt: new Date(NOW - 9 * DAY).toISOString(),
    rating: 4.2,
    reviewCount: 312,
  },
  {
    id: 23,
    name: "주방 매트",
    category: "home",
    price: 38000,
    originalPrice: 52000,
    stock: 35,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Mat",
    createdAt: new Date(NOW - 2 * DAY).toISOString(),
    rating: 4.3,
    reviewCount: 218,
  },
  {
    id: 24,
    name: "핸드크림 세트",
    category: "beauty",
    price: 35000,
    stock: 11,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Handcream",
    createdAt: new Date(NOW - 50 * DAY).toISOString(),
    rating: 4.5,
    reviewCount: 487,
  },
  {
    id: 25,
    name: "무선 충전기 패드",
    category: "electronics",
    price: 45000,
    stock: 0,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Charger",
    createdAt: new Date(NOW - 120 * DAY).toISOString(),
    rating: 4.0,
    reviewCount: 234,
  },
  {
    id: 26,
    name: "베이지 후드티",
    category: "fashion",
    price: 69000,
    originalPrice: 89000,
    stock: 18,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Hoodie",
    createdAt: new Date(NOW - 3 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 542,
  },
  {
    id: 27,
    name: "미니 가습기",
    category: "home",
    price: 32000,
    stock: 23,
    imageUrl: "https://placehold.co/300x300/999/fff?text=Humidifier",
    createdAt: new Date(NOW - 16 * DAY).toISOString(),
    rating: 4.1,
    reviewCount: 198,
  },
  {
    id: 28,
    name: "향수 50ml",
    category: "beauty",
    price: 128000,
    originalPrice: 158000,
    stock: 5,
    imageUrl: "https://placehold.co/300x300/c66/fff?text=Perfume",
    createdAt: new Date(NOW - 22 * DAY).toISOString(),
    rating: 4.8,
    reviewCount: 3421,
  },
  {
    id: 29,
    name: "태블릿 11인치",
    category: "electronics",
    price: 689000,
    stock: 4,
    imageUrl: "https://placehold.co/300x300/333/fff?text=Tablet",
    createdAt: new Date(NOW - 35 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 891,
  },
  {
    id: 30,
    name: "캔버스 스니커즈",
    category: "fashion",
    price: 49000,
    stock: 42,
    imageUrl: "https://placehold.co/300x300/666/fff?text=Canvas",
    createdAt: new Date(NOW - 1 * DAY).toISOString(),
    rating: 4.2,
    reviewCount: 178,
  },
];

function applyFilters(params: URLSearchParams) {
  let list = [...PRODUCTS];

  const category = params.get("category") ?? "all";
  if (category !== "all") {
    list = list.filter((p) => p.category === category);
  }

  const minPrice = params.get("minPrice");
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));

  const maxPrice = params.get("maxPrice");
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));

  const q = params.get("q")?.trim().toLowerCase();
  if (q) {
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }

  const sort = params.get("sort") ?? "latest";
  switch (sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "popular":
      list.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "latest":
    default:
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  return list;
}

function paginate(list: MockProduct[], params: URLSearchParams) {
  const page = Number(params.get("page") ?? "1");
  const size = Number(params.get("size") ?? "12");
  const start = (page - 1) * size;
  return {
    products: list.slice(start, start + size),
    totalCount: list.length,
  };
}

export function installMockApi() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.startsWith("/api/products")) {
      // 네트워크 latency 흉내
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 300),
      );

      const query = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(query);
      const filtered = applyFilters(params);
      const result = paginate(filtered, params);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };
}
