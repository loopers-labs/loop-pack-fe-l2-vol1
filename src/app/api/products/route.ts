import { NextResponse } from 'next/server';

// mock 백엔드 (Next route handler). 실제 DB 대신 여기서 데이터를 내려준다.
// 필요하면 자유롭게 늘리거나 구조를 바꿔도 된다.

const products = {
  demo1: [
    { value: 24, stock: 3, delivery: '내일(토) 도착보장' },
    { value: 25, stock: 0, delivery: '내일(토) 도착보장' },
    { value: 26, stock: 12, delivery: '내일(토) 도착보장' },
    { value: 27, stock: 5, delivery: '내일(토) 도착보장' },
    { value: 28, stock: 0, delivery: '내일(토) 도착보장' },
  ],
  demo2: [
    {
      id: 'gt-100',
      name: '그로우턴 앰플 100ml기획(+100ml)',
      price: 38800,
      discountRate: 2,
      thumbnail: '/next.svg',
      sameDayDelivery: true,
      stock: 8,
    },
    {
      id: 'gt-130',
      name: '그로우턴 앰플 130ml기획(+30ml)',
      price: 33800,
      discountRate: 2,
      thumbnail: '/next.svg',
      sameDayDelivery: true,
      stock: 0,
    },
  ],
  demo3: [
    {
      id: 'bg-10',
      label: '베이글 5+5개',
      promo: '최대할인',
      price: 21000,
      quantity: 10,
      freeShipping: true,
      stock: 20,
    },
    { id: 'bg-1', label: '베이글 2개', price: 4200, quantity: 2, freeShipping: false, stock: 5 },
    { id: 'bg-2', label: '베이글 3개', price: 8400, quantity: 3, freeShipping: false, stock: 5 },
    { id: 'bg-3', label: '베이글 4개', price: 12600, quantity: 4, freeShipping: true, stock: 5 },
  ],
};

export async function GET() {
  return NextResponse.json(products);
}
