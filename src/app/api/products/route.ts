import { NextResponse } from 'next/server';

// mock 백엔드 (Next route handler). 실제 DB 대신 여기서 데이터를 내려준다.
// 필요하면 자유롭게 늘리거나 구조를 바꿔도 된다.
const products = [
  {
    id: 'p1',
    name: '베이글 플레인',
    price: 3200,
    originalPrice: 4000,
    image: '/next.svg',
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
    id: 'p2',
    name: '에브리씽 베이글',
    price: 3800,
    originalPrice: null,
    image: '/next.svg',
    freeShipping: false,
    sizes: [],
  },
];

// ─── Select (Headless) 테스트용 데이터 ──────────────────────────
// 각 셀렉트박스 스타일마다 item의 모양이 다르다. useSelect가
// 제네릭으로 어떤 형태든 커버하는지를 검증하기 위해 세 가지 다른
// 형태의 객체 배열을 둔다.

// 1) 제목 + 가격 + 무료배송 뱃지용
export interface TitlePriceOption {
  id: string;
  name: string;
  price: number;
  freeShipping: boolean;
}

export const titlePriceOptions: TitlePriceOption[] = [
  { id: 'tp1', name: '플레인 베이글', price: 3200, freeShipping: true },
  { id: 'tp2', name: '에브리씽 베이글', price: 3800, freeShipping: false },
  { id: 'tp3', name: '시나몬 레이즌 베이글', price: 4200, freeShipping: true },
  { id: 'tp4', name: '블루베리 베이글', price: 4500, freeShipping: false },
];

// 2) 사이즈 + 도착요일 + 품절 여부용
export interface SizeOption {
  value: number;
  arrivalText: string;
  soldOut: boolean;
}

export const sizeOptions: SizeOption[] = [
  { value: 24, arrivalText: '내일 (토) 도착보장', soldOut: false },
  { value: 25, arrivalText: '내일 (토) 도착보장', soldOut: true },
  { value: 26, arrivalText: '내일 (토) 도착보장', soldOut: false },
  { value: 27, arrivalText: '모레 (일) 도착보장', soldOut: false },
  { value: 28, arrivalText: '모레 (일) 도착보장', soldOut: true },
];

// 3) 썸네일 이미지용
export interface ThumbnailOption {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const thumbnailOptions: ThumbnailOption[] = [
  { id: 'th1', name: '플레인 베이글', description: '고소한 오리지널', image: '/next.svg' },
  { id: 'th2', name: '에브리씽 베이글', description: '풍성한 토핑', image: '/next.svg' },
  { id: 'th3', name: '시나몬 레이즌', description: '달콤한 계핏가루', image: '/next.svg' },
  { id: 'th4', name: '블루베리', description: '상큼한 베리', image: '/next.svg' },
];

export async function GET() {
  return NextResponse.json({ products, totalCount: products.length });
}
