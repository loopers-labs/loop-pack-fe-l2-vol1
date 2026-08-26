import { HttpResponse, http } from 'msw'
import {
  productListCategories,
  productListProducts,
} from '@/_pages/product-list/testing/product-list-fixtures'
import {
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORT_VALUES,
  type Product,
  type ProductSort,
} from '@/entities/product'

// app/api/products/route.ts와 같은 검증 규칙을 따른다. 실제 서버가 400을 주는 요청에
// 이 핸들러가 200을 주면 잘못된 쿼리를 보내기 시작하는 회귀를 테스트가 놓친다.
const INVALID_REQUEST_MESSAGE = '요청 조건을 확인해주세요.'
const MAX_PAGE_SIZE = 24

const isPositiveInteger = (value: string) => /^[1-9]\d*$/.test(value)

const sortProducts = (products: Product[], sort: ProductSort) =>
  [...products].sort((first, second) => {
    switch (sort) {
      case 'popular':
        return second.reviewCount - first.reviewCount || second.rating - first.rating
      case 'price-asc':
        return first.price - second.price
      case 'price-desc':
        return second.price - first.price
      case 'latest':
        return Date.parse(second.createdAt) - Date.parse(first.createdAt)
    }
  })

export const productListFixtureResponse = (request: Request) => {
  const params = new URL(request.url).searchParams
  const query = params.get('q')?.trim().toLocaleLowerCase('ko') ?? ''
  const category = params.get('category')
  const sortParam = params.get('sort')
  const pageValue = params.get('page') ?? '1'
  const pageSizeValue = params.get('pageSize') ?? String(PRODUCT_PAGE_SIZE)
  const page = Number(pageValue)
  const pageSize = Number(pageSizeValue)

  // 정렬값이 없으면 서버도 정렬하지 않는다. 여기서 기본 정렬을 넣으면 같은 요청에
  // 서버와 다른 순서를 돌려주게 된다.
  const sort = PRODUCT_SORT_VALUES.find((value) => value === sortParam) ?? null
  const isValidSort = sortParam === null || sort !== null
  const isValidCategory =
    category === null ||
    category === 'all' ||
    productListCategories.some((item) => item.id === category)
  const isValidPage = isPositiveInteger(pageValue)
  const isValidPageSize = isPositiveInteger(pageSizeValue) && pageSize <= MAX_PAGE_SIZE

  if (!isValidSort || !isValidCategory || !isValidPage || !isValidPageSize) {
    return HttpResponse.json({ message: INVALID_REQUEST_MESSAGE }, { status: 400 })
  }

  const filteredProducts = productListProducts.filter((product) => {
    const matchesCategory = category === null || category === 'all' || product.category === category
    const searchable = `${product.brand} ${product.name}`.toLocaleLowerCase('ko')

    return matchesCategory && searchable.includes(query)
  })
  const sortedProducts = sort === null ? filteredProducts : sortProducts(filteredProducts, sort)
  const start = (page - 1) * pageSize

  return HttpResponse.json({
    products: sortedProducts.slice(start, start + pageSize),
    categories: productListCategories,
    totalCount: filteredProducts.length,
    page,
    pageSize,
  })
}

export const productListSuccessHandler = http.get('/api/products', ({ request }) =>
  productListFixtureResponse(request),
)
