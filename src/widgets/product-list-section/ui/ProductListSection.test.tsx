import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  // Week 08 Step 2 보강 — 담기/빼기 정상/경계: 위시리스트 증감과 장바구니 불변
  it('찜 버튼을 추가/제거하면 위시리스트만 0→1→0으로 바뀌고 장바구니는 0을 유지한다', async () => {
    const user = userEvent.setup();
    renderHeaderAndProductListSection();
    const wishlistButton = screen.getByRole('button', { name: '1번 상품 위시리스트' });
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();

    await user.click(wishlistButton);
    expect(screen.getByText('위시리스트 1')).toBeInTheDocument();
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
    expect(wishlistButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(wishlistButton);
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
    expect(wishlistButton).toHaveAttribute('aria-pressed', 'false');
  });

  // Week 08 Step 2 보강 — 담기/빼기 정상/경계: 장바구니 증감과 위시리스트 불변
  it('담기 버튼을 추가/제거하면 장바구니만 0→1→0으로 바뀌고 위시리스트는 0을 유지한다', async () => {
    const user = userEvent.setup();
    renderHeaderAndProductListSection();
    const cartButton = screen.getByRole('button', { name: '1번 상품 담기' });
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();

    await user.click(cartButton);
    expect(screen.getByText('장바구니 1')).toBeInTheDocument();
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(cartButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(cartButton);
    expect(screen.getByText('장바구니 0')).toBeInTheDocument();
    expect(screen.getByText('위시리스트 0')).toBeInTheDocument();
    expect(cartButton).toHaveAttribute('aria-pressed', 'false');
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

    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });
});
