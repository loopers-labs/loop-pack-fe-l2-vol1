import { PRODUCT_PAGE_SIZE, type Category, type Product } from '@/entities/product'

export const productListCategories: Category[] = [
  { id: 'casual', name: '캐주얼' },
  { id: 'digital', name: '디지털' },
]

const createProduct = (
  id: string,
  name: string,
  category: Product['category'],
  price: number,
  reviewCount: number,
  createdAt: string,
): Product => ({
  id,
  brand: '테스트 브랜드',
  name,
  category,
  price,
  originalPrice: null,
  image: '/no-image.svg',
  freeShipping: false,
  sizes: [],
  rating: 4.5,
  reviewCount,
  createdAt,
})

// casual 상품이 한 페이지를 넘기도록 채운다(이름 있는 casual 2개 + filler).
// 페이지 크기가 바뀌어도 "2페이지가 된다"는 전제가 유지된다.
const fillerProducts = Array.from({ length: PRODUCT_PAGE_SIZE - 1 }, (_, offset) => {
  const number = offset + 1

  return createProduct(
    `casual-filler-${number}`,
    `캐주얼 기본상품 ${number}`,
    'casual',
    40_000 + number * 1_000,
    number,
    `2026-07-${String(number).padStart(2, '0')}T00:00:00.000Z`,
  )
})

export const productListProducts: Product[] = [
  createProduct('casual-latest', '캐주얼 신상품', 'casual', 30_000, 10, '2026-08-03T00:00:00.000Z'),
  createProduct(
    'casual-popular',
    '캐주얼 인기상품',
    'casual',
    20_000,
    100,
    '2026-08-01T00:00:00.000Z',
  ),
  createProduct(
    'digital-low',
    '디지털 실속상품',
    'digital',
    10_000,
    20,
    '2026-08-02T00:00:00.000Z',
  ),
  ...fillerProducts,
]
