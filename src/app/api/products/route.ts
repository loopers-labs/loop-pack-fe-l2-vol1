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

// Select 데모용 옵션 3종 (사이즈 / 썸네일 / 텍스트)
const selectOptions = {
  sizeOptions: [
    { id: '23', label: '23', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '24', label: '24', deliveryLabel: '내일(토) 도착보장', stock: 5 },
    { id: '25', label: '25', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '26', label: '26', deliveryLabel: '내일(토) 도착보장', stock: 2 },
    { id: '27', label: '27', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '28', label: '28', deliveryLabel: '내일(토) 도착보장', stock: 4 },
    { id: '29', label: '29', deliveryLabel: '내일(토) 도착보장', stock: 1 },
  ],
  thumbnailOptions: [
    {
      id: '100ml',
      name: '그로우턴 앰플 100ml기획(+100ml)',
      thumbnailColor: '#e8956d',
      discountRate: 2,
      price: 38800,
      badgeLabel: '오늘드림',
      stock: 5,
    },
    {
      id: '130ml',
      name: '그로우턴 앰플 130ml기획(+30ml)',
      thumbnailColor: '#f0c0a8',
      discountRate: 2,
      price: 33800,
      badgeLabel: '오늘드림',
      stock: 3,
    },
    {
      id: '50ml-mini',
      name: '그로우턴 앰플 미니 50ml',
      thumbnailColor: '#f5dcc8',
      discountRate: 5,
      price: 19800,
      badgeLabel: '오늘드림',
      stock: 0,
    },
    {
      id: 'double-set',
      name: '그로우턴 앰플 더블 세트(100ml×2)',
      thumbnailColor: '#d98a5f',
      discountRate: 10,
      price: 69800,
      badgeLabel: '오늘드림',
      stock: 2,
    },
  ],
  textOptions: [
    {
      id: 'bagel-10',
      name: '[최대할인] 베이글 5+5개',
      price: 21000,
      unitPrice: 2100,
      badgeLabel: '무료배송',
      stock: 5,
    },
    {
      id: 'bagel-5',
      name: '베이글 5개',
      price: 11000,
      unitPrice: 2200,
      badgeLabel: '무료배송',
      stock: 0,
    },
    {
      id: 'bagel-3',
      name: '베이글 3개',
      price: 7500,
      unitPrice: 2500,
      badgeLabel: null,
      stock: 4,
    },
    {
      id: 'bagel-1',
      name: '베이글 1개',
      price: 4200,
      unitPrice: 4200,
      badgeLabel: null,
      stock: 10,
    },
  ],
};

export async function GET() {
  return NextResponse.json({
    products,
    selectOptions,
    totalCount: products.length,
  });
}
