import { ProductList } from '@/_pages/products/ui/ProductList';
import { ProductListFilters } from '@/features/product';
import { renderWithProviders } from '@tests/render-with-providers';

/** 목록만 그리면 조건을 바꿀 수단이 화면에 없어 필터를 함께 그린다. */
export function renderProductList(
  searchParams = '',
  { gcTime }: { gcTime?: number } = {},
) {
  return renderWithProviders(
    <>
      <ProductListFilters />
      <ProductList />
    </>,
    { searchParams, gcTime },
  );
}
