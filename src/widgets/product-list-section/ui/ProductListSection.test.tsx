import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProductListSection } from './ProductListSection';
import { Header } from '@/widgets/header/ui/Header';
import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { useCartStore } from '@/entities/cart/model/useCartStore';
import type { Product } from '@/entities/product/model/product';

const PRODUCT: Product = {
  id: 'p1',
  brand: 'Loopers Select',
  name: '테스트 상품',
  category: 'casual',
  price: 10000,
  originalPrice: null,
  image: '/images/products/p1.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.5,
  reviewCount: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderHeaderAndProductListSection() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Header />
      <ProductListSection products={[PRODUCT]} emptyMessage="상품이 없습니다.">
        <h2>테스트 섹션</h2>
      </ProductListSection>
    </QueryClientProvider>,
  );
}

/* AI-generated : week06-fsd.md 4단계 기준 — widgets/product-card/ui/ProductCard.test.tsx에서 이관.
   ProductListSection이 ProductCard+features(찜/담기 버튼)를 실제로 조합하는 주체이므로, 여기서 Header와 함께
   렌더링해 store 동기화를 검증한다. (이름 변경: Body → ProductListSection) */
describe('Header/ProductListSection의 store 동기화 (홈·목록이 공유하는 store 검증)', () => {
  beforeEach(() => {
    useWishlistStore.setState({ productIds: new Set() });
    useCartStore.setState({ productIds: new Set() });
  });

  it('ProductListSection에서 찜을 누르면 Header 위시리스트 개수도 같이 바뀐다', () => {
    renderHeaderAndProductListSection();
    expect(screen.getByText('위시리스트 0')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('1번 상품 위시리스트'));

    expect(screen.getByText('위시리스트 1')).toBeTruthy();
  });

  it('ProductListSection에서 담기를 누르면 Header 장바구니 개수도 같이 바뀐다', () => {
    renderHeaderAndProductListSection();
    expect(screen.getByText('장바구니 0')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('1번 상품 담기'));

    expect(screen.getByText('장바구니 1')).toBeTruthy();
  });
});

describe('ProductListSection', () => {
  it('상품이 없으면 안내 문구를 보여준다', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProductListSection products={[]} emptyMessage="검색 결과가 없습니다.">
          <p>총 0개</p>
        </ProductListSection>
      </QueryClientProvider>,
    );

    expect(screen.getByText('검색 결과가 없습니다.')).toBeTruthy();
  });
});
