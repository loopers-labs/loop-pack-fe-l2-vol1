'use client'

import Image from 'next/image'
import { create } from 'zustand'

import {
  calculateCardPresentation,
  type PerformanceLabProduct,
  performanceLabProducts,
} from './products'

type WishlistState = {
  wishlistIds: Array<string>
  toggleWishlist: (productId: string) => void
}

const usePerformanceWishlist = create<WishlistState>((set) => ({
  wishlistIds: [],
  toggleWishlist: (productId) => {
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(productId)
        ? state.wishlistIds.filter((id) => id !== productId)
        : [...state.wishlistIds, productId],
    }))
  },
}))

function PerformanceProductCard({
  product,
}: {
  product: PerformanceLabProduct
}) {
  const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds)
  const toggleWishlist = usePerformanceWishlist((state) => state.toggleWishlist)
  const selected = wishlistIds.includes(product.id)
  const presentation = calculateCardPresentation(product.id, selected)

  return (
    <article className="grid min-w-0 gap-[10px] border border-[#d9d9d9] bg-white p-3">
      <Image
        className="block aspect-square h-auto w-full bg-[#efefef] object-cover"
        src={product.image}
        alt=""
        width={320}
        height={320}
      />
      <h2 className="min-h-[2.8em] text-base leading-[1.4]">{product.name}</h2>
      <p className="text-[#656565] tabular-nums">화면 계산 {presentation}</p>
      <button
        className="min-h-[42px] border border-[#1f1f1f] bg-white text-[#1f1f1f] [font:inherit] focus-visible:[outline:3px_solid_#376bd6] focus-visible:outline-offset-[3px] aria-pressed:bg-[#1f1f1f] aria-pressed:text-white"
        type="button"
        aria-pressed={selected}
        onClick={() => {
          toggleWishlist(product.id)
        }}
      >
        {selected ? '찜 해제' : '찜하기'}
      </button>
    </article>
  )
}

export default function PerformanceLabPage() {
  return (
    <main className="mx-auto w-[min(100%_-_32px,1280px)] pt-12 pb-20">
      <header className="mb-8 max-w-[720px]">
        <p className="leading-[1.7]">Advanced A · 선택 과제</p>
        <h1 className="[margin:8px_0_12px] text-[clamp(32px,5vw,56px)] leading-[1.08] tracking-[-0.04em]">
          상품 카드 렌더 범위 측정
        </h1>
        <p className="leading-[1.7]">
          이미지가 모두 표시된 뒤 같은 상품의 찜 버튼을 한 번 누르고,
          Performance와 React Profiler에서 렌더 범위를 확인하세요.
        </p>
      </header>
      <section
        className="grid grid-cols-4 gap-6 [@media(max-width:680px)]:grid-cols-2 [@media(max-width:680px)]:gap-4 [@media(min-width:681px)_and_(max-width:960px)]:grid-cols-3"
        aria-label="성능 측정 상품 24개"
      >
        {performanceLabProducts.map((product) => (
          <PerformanceProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  )
}
