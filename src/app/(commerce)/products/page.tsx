import type { SearchParams } from 'nuqs/server';

import { ProductsPage } from '@/_pages/products';

export default function Products({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ProductsPage searchParams={searchParams} />;
}
