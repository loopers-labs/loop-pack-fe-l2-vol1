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

// Select 데모용 옵션 4종 (사이즈 / 썸네일 / 텍스트 / 색상 스와치)
const selectOptions = {
  sizeOptions: [
    { id: '23', label: '23', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '24', label: '24', deliveryLabel: '내일(토) 도착보장', stock: 5 },
    { id: '25', label: '25', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '26', label: '26', deliveryLabel: '내일(토) 도착보장', stock: 2 },
    { id: '27', label: '27', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '28', label: '28', deliveryLabel: '내일(토) 도착보장', stock: 4 },
    { id: '29', label: '29', deliveryLabel: '내일(토) 도착보장', stock: 1 },
    { id: '30', label: '30', deliveryLabel: '내일(토) 도착보장', stock: 7 },
    { id: '31', label: '31', deliveryLabel: '내일(토) 도착보장', stock: 0 },
    { id: '32', label: '32', deliveryLabel: '내일(토) 도착보장', stock: 3 },
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
      id: 'bagel-20',
      name: '[대용량] 베이글 10+10개',
      price: 38000,
      unitPrice: 1900,
      badgeLabel: '무료배송',
      stock: 3,
    },
    {
      id: 'bagel-15',
      name: '베이글 15개',
      price: 30000,
      unitPrice: 2000,
      badgeLabel: '무료배송',
      stock: 0,
    },
    {
      id: 'bagel-10',
      name: '[최대할인] 베이글 5+5개',
      price: 21000,
      unitPrice: 2100,
      badgeLabel: '무료배송',
      stock: 5,
    },
    {
      id: 'bagel-7',
      name: '베이글 7개',
      price: 15400,
      unitPrice: 2200,
      badgeLabel: '무료배송',
      stock: 2,
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
      id: 'bagel-4',
      name: '베이글 4개',
      price: 9600,
      unitPrice: 2400,
      badgeLabel: null,
      stock: 6,
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
      id: 'bagel-2',
      name: '베이글 2개',
      price: 5600,
      unitPrice: 2800,
      badgeLabel: null,
      stock: 0,
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
  // 그룹 select 데모용. tone 순으로 정렬해 내려준다 (사용처가 인접 경계로 그룹 라벨을 그린다)
  colorOptions: [
    {
      id: 'terracotta',
      name: '테라코타',
      color: '#c96f4a',
      stock: 4,
      tone: 'warm',
    },
    { id: 'walnut', name: '월넛', color: '#6b4a35', stock: 1, tone: 'warm' },
    {
      id: 'blush',
      name: '블러시 핑크',
      color: '#e6b7b0',
      stock: 0,
      tone: 'warm',
    },
    {
      id: 'dusty-blue',
      name: '더스티 블루',
      color: '#7d94ad',
      stock: 3,
      tone: 'cool',
    },
    {
      id: 'sage',
      name: '세이지 그린',
      color: '#9caf88',
      stock: 2,
      tone: 'cool',
    },
    { id: 'olive', name: '올리브', color: '#8a8f5c', stock: 0, tone: 'cool' },
    { id: 'cream', name: '크림', color: '#f3ead8', stock: 2, tone: 'neutral' },
    {
      id: 'ivory',
      name: '아이보리',
      color: '#f6f1e7',
      stock: 6,
      tone: 'neutral',
    },
    {
      id: 'charcoal',
      name: '차콜',
      color: '#3d3d3f',
      stock: 5,
      tone: 'neutral',
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
