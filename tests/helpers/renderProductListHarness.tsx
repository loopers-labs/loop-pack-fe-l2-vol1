import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'

import { useCartStore } from '@/entities/cart/model/CartStore'
import { ProductService } from '@/entities/product/api/ProductService'
import { ProductListRouteParams } from '@/entities/product/model/ProductListRouteParams'
import { useWishlistStore } from '@/entities/wishlist/model/WishlistStore'
import { useProductFilters } from '@/features/product-filter/model/useProductFilters'
import { FilterBar } from '@/features/product-filter/ui/FilterBar'
import { useProductListState } from '@/views/product-list/model/useProductListState'
import { Header } from '@/widgets/header/ui/Header'
import { ProductListSection } from '@/widgets/product-list/ui/ProductListSection'

type ProductListHarnessProps = {
  readonly withHeader: boolean
}

type RenderProductListHarnessOptions = {
  readonly searchParams?: string
  readonly withHeader?: boolean
}

const productService = new ProductService()
let activeQueryClient: QueryClient | undefined

function OptionalHeader({ withHeader }: ProductListHarnessProps) {
  if (!withHeader) {
    return null
  }

  return <Header />
}

function ProductListHarness({ withHeader }: ProductListHarnessProps) {
  const { filters, updateFilter, updatePage } = useProductFilters()
  const request = ProductListRouteParams.toRequest({
    q: filters.q,
    category: filters.category,
    sort: filters.sort,
    page: String(filters.page),
  })
  const options = productService.getProductList(request)
  const query = useQuery(options)
  const state = useProductListState(
    query,
    options.queryKey,
    JSON.stringify(request),
  )

  return (
    <>
      <OptionalHeader withHeader={withHeader} />
      <main>
        <FilterBar
          filters={filters}
          totalCount={state.displayedData?.totalCount ?? 0}
          pageSize={12}
          updateFilter={updateFilter}
          updatePage={updatePage}
        />
        <ProductListSection
          query={query}
          displayedData={state.displayedData}
          displayedDataKey={state.displayedDataKey}
          scope={JSON.stringify(request)}
        />
      </main>
    </>
  )
}

export function renderProductListHarness({
  searchParams = '',
  withHeader = false,
}: RenderProductListHarnessOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  activeQueryClient = queryClient
  const NuqsTestingAdapter = withNuqsTestingAdapter({
    hasMemory: true,
    searchParams,
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter>
        <ProductListHarness withHeader={withHeader} />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  )
}

export function resetProductListHarnessState() {
  activeQueryClient?.clear()
  activeQueryClient = undefined
  localStorage.clear()
  useCartStore.setState({ items: {} })
  useWishlistStore.setState({ items: {} })
}
