'use client'

// 7주차 INP 실험 전용 페이지다. 커머스 화면 흐름에 속하지 않으므로
// 9주차 보호 경로 판단(사용자 고유 데이터를 보여주는 화면) 대상이 아니다.

import Image from 'next/image'
import { create } from 'zustand'
import {
  calculateCardPresentation,
  performanceLabProducts,
  type PerformanceLabProduct,
} from './products'
import styles from './performance-lab.module.css'

type WishlistState = {
  wishlistIds: string[]
  toggleWishlist: (productId: string) => void
}

const usePerformanceWishlist = create<WishlistState>((set) => ({
  wishlistIds: [],
  toggleWishlist: (productId) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(productId)
        ? state.wishlistIds.filter((id) => id !== productId)
        : [...state.wishlistIds, productId],
    })),
}))

function PerformanceProductCard({ product }: { product: PerformanceLabProduct }) {
  // 배열을 그대로 구독하면 toggle 한 번에 참조가 바뀌어 구독한 24장 전부가 리렌더된다.
  // Profiler에서 커밋 1건에 p1~p24가 모두 들어오고 이유가 SyncExternalStore 변경으로 찍혔다.
  // 이 카드에 필요한 값은 boolean 하나이므로 selector에서 좁혀 다른 카드의 값이 안 바뀌게 한다.
  const selected = usePerformanceWishlist((state) => state.wishlistIds.includes(product.id))
  const toggleWishlist = usePerformanceWishlist((state) => state.toggleWishlist)
  const presentation = calculateCardPresentation(product.id, selected)

  return (
    <article className={styles.card}>
      <Image className={styles.image} src={product.image} alt="" width={320} height={320} />
      <h2>{product.name}</h2>
      <p className={styles.checksum}>화면 계산 {presentation}</p>
      <button type="button" aria-pressed={selected} onClick={() => toggleWishlist(product.id)}>
        {selected ? '찜 해제' : '찜하기'}
      </button>
    </article>
  )
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
  )
}
