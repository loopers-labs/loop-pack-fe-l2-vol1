import { NextResponse } from 'next/server';
import type { Product } from '@/types/product';

const NOW = Date.now();
const DAY = 1000 * 60 * 60 * 24;

const products: Product[] = [
  {
    id: 1,
    name: '무선 노이즈캔슬링 헤드폰',
    category: 'electronics',
    price: 289000,
    originalPrice: 389000,
    stock: 12,
    imageUrl: 'https://placehold.co/300x300/333/fff?text=Headphone',
    createdAt: new Date(NOW - 2 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 1842,
    deliveryType: '샛별배송',
    freeShipping: true,
    description:
      '40mm 커스텀 드라이버와 액티브 노이즈캔슬링으로 몰입감 있는 사운드를 제공합니다. 최대 30시간 배터리.',
    sizes: [],
    options: [
      { id: 'opt1', name: '헤드폰 단품', price: 289000, stock: 12 },
      {
        id: 'opt2',
        name: '헤드폰 + 케이스 세트',
        price: 319000,
        stock: 8,
      },
      { id: 'opt3', name: '헤드폰 + 거치대 세트', price: 329000, stock: 0 },
    ],
  },
  {
    id: 2,
    name: '메커니컬 키보드 87키',
    category: 'electronics',
    price: 165000,
    originalPrice: null,
    stock: 3,
    imageUrl: 'https://placehold.co/300x300/333/fff?text=Keyboard',
    createdAt: new Date(NOW - 30 * DAY).toISOString(),
    rating: 4.5,
    reviewCount: 932,
    deliveryType: '샛별배송',
    freeShipping: false,
    description:
      '체리 MX 적축 스위치 탑재. 텐키리스 레이아웃으로 데스크 공간을 절약합니다.',
    sizes: [],
    options: [
      { id: 'opt4', name: '적축', price: 165000, stock: 3 },
      { id: 'opt5', name: '갈축', price: 165000, stock: 7 },
      { id: 'opt6', name: '청축', price: 165000, stock: 0 },
    ],
  },
  {
    id: 3,
    name: '스마트워치 5세대',
    category: 'electronics',
    price: 419000,
    originalPrice: 499000,
    stock: 0,
    imageUrl: 'https://placehold.co/300x300/333/fff?text=Watch',
    createdAt: new Date(NOW - 60 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 2104,
    deliveryType: '샛별배송',
    freeShipping: true,
    description:
      '혈중 산소 측정, 수면 추적, GPS 내장. 방수 등급 5ATM으로 수영 시에도 착용 가능합니다.',
    sizes: [
      { value: 40, stock: 0 },
      { value: 44, stock: 0 },
    ],
    options: [
      { id: 'opt7', name: '스마트워치 단품', price: 419000, stock: 0 },
      {
        id: 'opt8',
        name: '스마트워치 + 스트랩 세트',
        price: 449000,
        stock: 0,
      },
    ],
  },
  {
    id: 4,
    name: '미니멀 백팩 25L',
    category: 'fashion',
    price: 89000,
    originalPrice: 119000,
    stock: 24,
    imageUrl: 'https://placehold.co/300x300/666/fff?text=Backpack',
    createdAt: new Date(NOW - 5 * DAY).toISOString(),
    rating: 4.3,
    reviewCount: 412,
    deliveryType: '판매자배송',
    freeShipping: true,
    description:
      '방수 코팅 원단에 노트북 수납 가능한 15.6인치 포켓 포함. 통근·통학용으로 적합합니다.',
    sizes: [],
    options: [
      { id: 'opt9', name: '블랙', price: 89000, stock: 24 },
      { id: 'opt10', name: '네이비', price: 89000, stock: 10 },
      { id: 'opt11', name: '그레이', price: 89000, stock: 0 },
    ],
  },
  {
    id: 5,
    name: '러닝 스니커즈',
    category: 'fashion',
    price: 142000,
    originalPrice: null,
    stock: 8,
    imageUrl: 'https://placehold.co/300x300/666/fff?text=Sneakers',
    createdAt: new Date(NOW - 14 * DAY).toISOString(),
    rating: 4.4,
    reviewCount: 687,
    deliveryType: '샛별배송',
    freeShipping: false,
    description:
      '초경량 메쉬 어퍼와 리액트 폼 미드솔로 장거리 러닝에도 편안한 착용감을 유지합니다.',
    sizes: [
      { value: 250, stock: 3 },
      { value: 260, stock: 8 },
      { value: 270, stock: 5 },
      { value: 280, stock: 0 },
      { value: 290, stock: 2 },
    ],
    options: [{ id: 'opt12', name: '러닝 스니커즈', price: 142000, stock: 8 }],
  },
  {
    id: 6,
    name: '울 코트 오버사이즈',
    category: 'fashion',
    price: 329000,
    originalPrice: 459000,
    stock: 5,
    imageUrl: 'https://placehold.co/300x300/666/fff?text=Coat',
    createdAt: new Date(NOW - 90 * DAY).toISOString(),
    rating: 4.2,
    reviewCount: 154,
    deliveryType: '판매자배송',
    freeShipping: true,
    description:
      '울 80% 혼방 원단으로 보온성과 핏을 모두 잡았습니다. 오버사이즈 실루엣.',
    sizes: [
      { value: 90, stock: 2 },
      { value: 95, stock: 3 },
      { value: 100, stock: 0 },
      { value: 105, stock: 0 },
    ],
    options: [
      { id: 'opt13', name: '차콜', price: 329000, stock: 3 },
      { id: 'opt14', name: '카멜', price: 329000, stock: 2 },
      { id: 'opt15', name: '블랙', price: 329000, stock: 0 },
    ],
  },
  {
    id: 7,
    name: '캔들 워머 램프',
    category: 'home',
    price: 78000,
    originalPrice: null,
    stock: 17,
    imageUrl: 'https://placehold.co/300x300/999/fff?text=Candle',
    createdAt: new Date(NOW - 45 * DAY).toISOString(),
    rating: 4.6,
    reviewCount: 521,
    deliveryType: '샛별배송',
    freeShipping: false,
    description:
      '할로겐 전구의 은은한 빛과 열로 캔들을 녹여 향을 퍼뜨립니다. 인테리어 조명으로도 활용 가능.',
    sizes: [],
    options: [
      { id: 'opt16', name: '골드', price: 78000, stock: 10 },
      { id: 'opt17', name: '실버', price: 78000, stock: 7 },
    ],
  },
  {
    id: 8,
    name: '비타민 C 세럼 30ml',
    category: 'beauty',
    price: 52000,
    originalPrice: 78000,
    stock: 19,
    imageUrl: 'https://placehold.co/300x300/c66/fff?text=Serum',
    createdAt: new Date(NOW - 11 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 2891,
    deliveryType: '샛별배송',
    freeShipping: true,
    description:
      '순수 비타민 C 15% 함유. 피부 톤 개선과 항산화에 집중한 고농축 세럼입니다.',
    sizes: [],
    options: [
      { id: 'opt18', name: '세럼 30ml', price: 52000, stock: 19 },
      {
        id: 'opt19',
        name: '세럼 30ml + 토너 기획세트',
        price: 79000,
        stock: 5,
      },
      {
        id: 'opt20',
        name: '세럼 30ml x 2개',
        price: 94000,
        stock: 0,
      },
    ],
  },
  {
    id: 9,
    name: '4K 모니터 27인치',
    category: 'electronics',
    price: 449000,
    originalPrice: 599000,
    stock: 7,
    imageUrl: 'https://placehold.co/300x300/333/fff?text=Monitor',
    createdAt: new Date(NOW - 18 * DAY).toISOString(),
    rating: 4.7,
    reviewCount: 1284,
    deliveryType: '판매자배송',
    freeShipping: true,
    description:
      'IPS 패널, 99% sRGB 색재현율. 피벗·높이 조절 스탠드 포함. 사무·디자인 작업에 적합합니다.',
    sizes: [],
    options: [
      { id: 'opt21', name: '모니터 단품', price: 449000, stock: 7 },
      {
        id: 'opt22',
        name: '모니터 + 모니터암 세트',
        price: 509000,
        stock: 3,
      },
    ],
  },
  {
    id: 10,
    name: '향수 50ml',
    category: 'beauty',
    price: 128000,
    originalPrice: 158000,
    stock: 5,
    imageUrl: 'https://placehold.co/300x300/c66/fff?text=Perfume',
    createdAt: new Date(NOW - 22 * DAY).toISOString(),
    rating: 4.8,
    reviewCount: 3421,
    deliveryType: '샛별배송',
    freeShipping: true,
    description:
      '시트러스 탑노트와 머스크 베이스가 조화를 이루는 유니섹스 향수. 지속력 약 8시간.',
    sizes: [],
    options: [
      { id: 'opt23', name: '50ml', price: 128000, stock: 5 },
      { id: 'opt24', name: '100ml', price: 198000, stock: 2 },
      { id: 'opt25', name: '50ml + 미니어처 세트', price: 148000, stock: 0 },
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const product = products.find((p) => String(p.id) === id);
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ product });
  }

  return NextResponse.json({ products, totalCount: products.length });
}
