// [AI] 얇은 라우팅 진입점. 비즈니스는 widgets/product-list에 위임.
// Suspense는 nuqs useQueryStates가 내부적으로 쓰는 useSearchParams()의 정적 프리렌더 bailout 방지.
import { Suspense } from 'react';
import { ProductList } from '@/widgets/product-list/ui/ProductList';

const ProductsPage = () => (
  <Suspense fallback={null}>
    <ProductList />
  </Suspense>
);

export default ProductsPage;
