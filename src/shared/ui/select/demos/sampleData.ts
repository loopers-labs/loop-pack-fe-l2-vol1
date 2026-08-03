// 데모용 옵션 데이터. value=객체 전체(가격·배송 계산)를 시연하려고 가격/배송 필드를 품는다.
// 각 목록에 품절 옵션을 최소 1개 넣어 "이동 스킵 + 선택 불가"를 눈으로 확인한다.
// 생김새는 docs/images/select1~3.png 를 참고한다.

// ── 텍스트형(select3.png) — 베이글 팩 ─────────────────────────────
export interface BagelPack {
  id: string;
  label: string;
  totalPrice: number;
  quantity: number;
  freeShipping: boolean;
  soldOut: boolean;
}

export const BAGEL_PACKS: BagelPack[] = [
  {
    id: "pack55",
    label: "[최대할인] 베이글 5+5개",
    totalPrice: 21000,
    quantity: 10,
    freeShipping: true,
    soldOut: false,
  },
  {
    id: "pack1",
    label: "베이글 1개",
    totalPrice: 4200,
    quantity: 1,
    freeShipping: false,
    soldOut: false,
  },
  {
    id: "pack3",
    label: "베이글 3개 세트",
    totalPrice: 12000,
    quantity: 3,
    freeShipping: true,
    soldOut: false,
  },
  {
    id: "packSold",
    label: "에브리씽 베이글 5개",
    totalPrice: 19000,
    quantity: 5,
    freeShipping: true,
    soldOut: true,
  },
];

// ── 사이즈형(select1.png) ─────────────────────────────
export interface SizeOption {
  id: string;
  size: number;
  stock: number;
  soldOut: boolean;
}

export const SIZE_OPTIONS: SizeOption[] = [
  { id: "s24", size: 24, stock: 3, soldOut: false },
  { id: "s25", size: 25, stock: 0, soldOut: true },
  { id: "s26", size: 26, stock: 12, soldOut: false },
  { id: "s27", size: 27, stock: 5, soldOut: false },
  { id: "s28", size: 28, stock: 0, soldOut: true },
];

// ── 썸네일형(select2.png) — 신발 상품(이미지는 전부 /shoes.jpg) ─────────────
export interface ShoeProduct {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  soldOut: boolean;
  image: string;
}

export const SHOE_PRODUCTS: ShoeProduct[] = [
  {
    id: "shoes",
    name: "신발",
    price: 38800,
    discountPercent: 2,
    soldOut: false,
    image: "/shoes.jpg",
  },
  {
    id: "bag",
    name: "가방",
    price: 33800,
    discountPercent: 2,
    soldOut: false,
    image: "/bag.jpg",
  },
  {
    id: "shirt",
    name: "셔츠",
    price: 35000,
    discountPercent: 5,
    soldOut: true,
    image: "/shirt.jpg",
  },
];
