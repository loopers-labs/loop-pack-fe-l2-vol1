'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/entities/product/model/types';
import { ProductCard } from './ProductCard';

interface NewProductCarouselProps {
  products: Product[];
}

interface ScrollState {
  canScrollNext: boolean;
  canScrollPrevious: boolean;
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`size-5 fill-none ${direction === 'left' ? 'rotate-180' : ''}`}
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-8 fill-none"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CAROUSEL_ID = 'new-products-carousel';

export function NewProductCarousel({ products }: NewProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollNext: true,
    canScrollPrevious: false,
  });

  const handleScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const remainingScroll =
      carousel.scrollWidth - carousel.clientWidth - carousel.scrollLeft;

    setScrollState({
      canScrollPrevious: carousel.scrollLeft > 1,
      canScrollNext: remainingScroll > 1,
    });
  };

  const handleMove = (direction: 'previous' | 'next') => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const shouldReduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const distance = carousel.clientWidth * 0.8;
    const targetLeft =
      carousel.scrollLeft + (direction === 'next' ? distance : -distance);

    carousel.scrollTo({
      left: targetLeft,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section aria-labelledby="new-products-title" className="py-12 sm:py-16">
      <div className="mb-6 sm:mb-8">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
          New arrival
        </p>
        <h2
          id="new-products-title"
          className="text-2xl font-bold tracking-[-0.03em] text-neutral-950"
        >
          신상품
        </h2>
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="신상품 목록"
        className="relative"
      >
        <div
          id={CAROUSEL_ID}
          ref={carouselRef}
          onScroll={handleScroll}
          className="grid snap-x snap-mandatory grid-flow-col auto-cols-[calc((100%_-_0.75rem)/2)] gap-3 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden sm:auto-cols-[calc((100%_-_2.5rem)/3)] sm:gap-5 lg:auto-cols-[calc((100%_-_4.5rem)/4)] lg:gap-6"
        >
          {products.map((product) => (
            <div key={product.id} className="min-w-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
          <Link
            href="/products"
            className="group/more min-w-0 snap-start rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
          >
            <div className="flex aspect-square items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition-colors group-hover/more:border-neutral-400 group-hover/more:text-neutral-950">
              <span className="flex flex-col items-center gap-3 text-sm font-semibold">
                <MoreArrowIcon />
                전체 상품 보기
              </span>
            </div>
          </Link>
        </div>

        <button
          type="button"
          aria-label="이전 신상품 보기"
          aria-controls={CAROUSEL_ID}
          disabled={!scrollState.canScrollPrevious}
          onClick={() => handleMove('previous')}
          className="absolute left-2 top-[35%] z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-opacity hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          aria-label="다음 신상품 보기"
          aria-controls={CAROUSEL_ID}
          disabled={!scrollState.canScrollNext}
          onClick={() => handleMove('next')}
          className="absolute right-2 top-[35%] z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-opacity hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </section>
  );
}
