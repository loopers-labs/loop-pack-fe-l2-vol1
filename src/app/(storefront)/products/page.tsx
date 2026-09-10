import type { SearchParams } from 'nuqs/server'
import {
  generateProductListMetadata,
  ProductListPage,
} from '@/_pages/product-list'

// 라우팅 진입점이다. 화면 조합과 metadata 계약은 페이지 슬라이스가 소유한다.
// searchParams는 기다리지 않고 그대로 넘긴다. 여기서 await하면 셸까지 늦어진다.
export const generateMetadata = generateProductListMetadata

export default function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return <ProductListPage searchParams={searchParams} />
}
