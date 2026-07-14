import type { Product, SizeSelectOption, TextSelectOption } from '@/types/product-options'

const products: Product[] = [
  {
    id: 'p1',
    name: '그로우턴 앰플 100ml기획(+100ml)',
    image: '/no-image.svg',
    price: 38800,
    discountRate: 2,
    badge: '오늘드림',
    stock: 15,
  },
  {
    id: 'p2',
    name: '그로우턴 앰플 130ml기획(+30ml)',
    image: '/no-image.svg',
    price: 33800,
    discountRate: 2,
    badge: '오늘드림',
    stock: 12,
  },
  {
    id: 'p3',
    name: '딸기요거트 45g(리뉴얼)',
    image: '/products/strawberry-yogurt.webp',
    price: 3900,
    badge: '오늘드림',
    bundleBadge: '1+1',
    stock: 5,
  },
  {
    id: 'p4',
    name: '멜론밀크 45g(리뉴얼)',
    image: '/products/melon-milk.webp',
    price: 3900,
    badge: '오늘드림',
    bundleBadge: '1+1',
    stock: 50,
  },
  {
    id: 'p5',
    name: '블루베리요거트 45g(리뉴얼)',
    image: '/products/blueberry-yogurt.webp',
    price: 3900,
    badge: '오늘드림',
    bundleBadge: '1+1',
    stock: 200,
  },
  {
    id: 'p6',
    name: '옥수수카스테라 45g',
    image: '/products/corn-castella.webp',
    price: 3900,
    bundleBadge: '1+1',
    stock: 0,
  },
]

const sizes: SizeSelectOption[] = [
  { value: 24, stock: 3, deliveryText: '내일(토) 도착보장' },
  { value: 25, stock: 0 },
  { value: 26, stock: 12, deliveryText: '내일(토) 도착보장' },
  { value: 27, stock: 5, deliveryText: '내일(토) 도착보장' },
  { value: 28, stock: 0 },
]

const purchaseOptions: TextSelectOption[] = [
  {
    id: 'po1',
    label: '베이글 5+5개',
    isMaxDiscount: true,
    price: 21000,
    unitPrice: 2100,
    isFreeShipping: true,
    stock: 150,
  },
  {
    id: 'po2',
    label: '베이글 1개',
    isMaxDiscount: false,
    price: 4200,
    unitPrice: 4200,
    isFreeShipping: false,
    stock: 120,
  },
]

export const getProducts = () => products

export const getSizes = () => sizes

export const getPurchaseOptions = () => purchaseOptions
