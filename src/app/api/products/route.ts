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
    stock: 5,
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
    price: 4200,
    originalPrice: null,
    image: '/next.svg',
    freeShipping: false,
    stock: 0,
    sizes: [],
  },
];

const textOptions = [
  {
    id: 't1',
    label: '베이글 5+5개',
    price: 21000,
    pricePerUnit: 2100,
    freeShipping: true,
    stock: 5,
    isMaxDiscount: true,
  },
  {
    id: 't2',
    label: '베이글 3개',
    price: 12000,
    pricePerUnit: 4000,
    freeShipping: false,
    stock: 0,
    isMaxDiscount: false,
  },
  {
    id: 't3',
    label: '베이글 1개',
    price: 4200,
    pricePerUnit: 4200,
    freeShipping: false,
    stock: 3,
    isMaxDiscount: false,
  },
];

export async function GET() {
  return NextResponse.json({
    products,
    textOptions,
    totalCount: products.length,
  });
}
