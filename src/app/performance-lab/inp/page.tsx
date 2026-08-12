'use client';

import Image from 'next/image';
import { create } from 'zustand';
import {
  calculateCardPresentation,
  performanceLabProducts,
  type PerformanceLabProduct,
} from './products';
import styles from './performance-lab.module.css';

type WishlistState = {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
};

const usePerformanceWishlist = create<WishlistState>((set) => ({
  wishlistIds: [],
  toggleWishlist: (productId) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(productId)
        ? state.wishlistIds.filter((id) => id !== productId)
        : [...state.wishlistIds, productId],
    })),
}));

function PerformanceProductCard({ product }: { product: PerformanceLabProduct }) {
  const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds);
  const toggleWishlist = usePerformanceWishlist((state) => state.toggleWishlist);
  const selected = wishlistIds.includes(product.id);
  const presentation = calculateCardPresentation(product.id, selected);

  return (
    <article className={styles.card}>
      <Image className={styles.image} src={product.image} alt="" width={320} height={320} />
      <h2>{product.name}</h2>
      <p className={styles.checksum}>화면 계산 {presentation}</p>
      <button type="button" aria-pressed={selected} onClick={() => toggleWishlist(product.id)}>
        {selected ? '찜 해제' : '찜하기'}
      </button>
    </article>
  );
}

export default function PerformanceLabPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Advanced A · 선택 과제</p>
        <h1>상품 카드 렌더 범위 측정</h1>
        <p>
          이미지가 모두 표시된 뒤 같은 상품의 찜 버튼을 한 번 누르고, Performance와 React
          Profiler에서 렌더 범위를 확인하세요.
        </p>
      </header>
      <section className={styles.grid} aria-label="성능 측정 상품 24개">
        {performanceLabProducts.map((product) => (
          <PerformanceProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
