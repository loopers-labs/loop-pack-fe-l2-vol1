"use client";

import Image from "next/image";
import { create } from "zustand";
import {
  calculateCardPresentation,
  performanceLabProducts,
  type PerformanceLabProduct,
} from "./products";
import styles from "./performance-lab.module.css";

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

function PerformanceProductCard({
  product,
}: {
  product: PerformanceLabProduct;
}) {
  // 배열 전체가 아니라 자기 id의 boolean만 구독한다.
  // 배열을 구독하면 토글마다 새 참조라 모든 카드가 리렌더되지만, boolean은 값이 안 바뀐 카드는 Object.is로 걸러져 리렌더링이 스킵된다.
  const selected = usePerformanceWishlist((state) =>
    state.wishlistIds.includes(product.id),
  );
  const toggleWishlist = usePerformanceWishlist(
    (state) => state.toggleWishlist,
  );
  const presentation = calculateCardPresentation(product.id, selected);

  return (
    <article className={styles.card}>
      <Image
        className={styles.image}
        src={product.image}
        alt=""
        width={320}
        height={320}
      />
      <h2>{product.name}</h2>
      <p className={styles.checksum}>화면 계산 {presentation}</p>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => toggleWishlist(product.id)}
      >
        {selected ? "찜 해제" : "찜하기"}
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
          이미지가 모두 표시된 뒤 같은 상품의 찜 버튼을 한 번 누르고,
          Performance와 React Profiler에서 렌더 범위를 확인하세요.
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
