'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StarIcon } from '@/components/icons/StarIcon';
import { ArrowIcon } from '@/components/icons/ArrowIcon';
import { formatWon, calcDiscount } from '@/utils/format';
import { CATEGORY_LABEL, CATEGORIES } from '@/constants/category';
import type { Product } from '@/types/product';
import type { Category } from '@/constants/category';

// ── 페이지 ──

export default function HomePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = (searchParams.get('category') ?? 'all') as Category;

  useEffect(() => {
    let ignore = false;

    void fetch('/api/products')
      .then((r) => r.json())
      .then((data: { products: Product[] }) => {
        if (!ignore) {
          setProducts(data.products);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filtered =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="font-family-body text-sm text-text-secondary">
            상품을 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-bg-card">
        <div className="mx-auto max-w-5xl px-8 py-16 md:py-24">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-accent">
            Curated Collection
          </p>
          <h2 className="mt-4 font-family-display text-4xl leading-tight font-light text-text md:text-5xl">
            Thoughtfully
            <br />
            <span className="italic">Selected</span> for You
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
            일상에 어울리는 제품들을 정성스럽게 골랐습니다. 좋은 디자인은 좋은
            삶을 만듭니다.
          </p>
          <Link
            href="#products"
            className="group mt-8 inline-flex items-center gap-2 border-b border-text pb-1 text-[14px] font-medium text-text transition-colors hover:border-accent hover:text-accent"
          >
            컬렉션 보기
            <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* 상품 목록 */}
      <main id="products" className="mx-auto max-w-5xl px-8 py-12">
        {/* 카테고리 필터 */}
        <nav className="mb-10 flex gap-3 overflow-x-auto">
          {CATEGORIES.map(({ key, label }) => (
            <Link
              key={key}
              href={key === 'all' ? '/' : `/?category=${key}`}
              className={`shrink-0 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all ${
                selectedCategory === key
                  ? 'bg-text text-bg-card'
                  : 'bg-bg-card text-text-secondary hover:text-text'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* 그리드 */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
          {filtered.map((product) => {
            const discount = product.originalPrice
              ? calcDiscount(product.originalPrice, product.price)
              : 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                {/* 이미지 */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* 칩 */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {discount > 0 && product.stock > 0 && (
                      <span className="rounded-full bg-discount px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                        -{discount}%
                      </span>
                    )}
                    {product.freeShipping && product.stock > 0 && (
                      <span className="rounded-full bg-bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-text shadow-sm backdrop-blur-sm">
                        무료배송
                      </span>
                    )}
                  </div>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-text/30 backdrop-blur-[2px]">
                      <span className="rounded-full bg-bg-card/90 px-4 py-1.5 text-[12px] font-semibold text-text">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="mt-4 px-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-text-caption">
                    {CATEGORY_LABEL[product.category]}
                  </span>

                  <h3 className="mt-1.5 text-[15px] font-medium leading-snug text-text">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[16px] font-semibold text-text">
                      {formatWon(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[13px] text-text-caption line-through">
                        {formatWon(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1">
                    <StarIcon />
                    <span className="text-[12px] font-medium text-text-secondary">
                      {product.rating}
                    </span>
                    <span className="text-[12px] text-text-caption">
                      ({product.reviewCount.toLocaleString('ko-KR')})
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-family-display text-lg italic text-text-caption">
              해당 카테고리에 상품이 없습니다.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
