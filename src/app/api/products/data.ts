// mock 상품 데이터(단일 출처). route handler와 Server Component가 함께 import한다.
// Server Component가 자기 앱 route를 HTTP로 self-fetch하면 빌드 프리렌더에서
// 앱이 안 떠 있어 실패하므로, 데이터는 이렇게 직접 참조한다.
export type ProductSize = { value: number; stock: number };
export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: ProductSize[];
};

export const products: Product[] = [
  {
    id: "p1",
    name: "베이글 플레인",
    price: 3200,
    originalPrice: 4000,
    image: "/next.svg",
    freeShipping: true,
    sizes: [
      { value: 24, stock: 3 },
      { value: 25, stock: 0 },
      { value: 26, stock: 12 },
      { value: 27, stock: 5 },
      { value: 28, stock: 0 },
    ],
  },
  {
    id: "p2",
    name: "에브리씽 베이글",
    price: 3800,
    originalPrice: null,
    image: "/next.svg",
    freeShipping: false,
    sizes: [],
  },
];
