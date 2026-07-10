'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { StarIcon } from '@/components/icons/StarIcon';
import { formatWon, calcDiscount } from '@/utils/format';
import { CATEGORY_LABEL, CATEGORIES } from '@/constants/category';
import { useProductFilter } from './_hooks/useProductFilter';
import { ProductListResponseSchema } from '@/types/product';
import type { Product } from '@/types/product';

// ?? Hero ?щ씪?대뱶 ?곗씠????

const HERO_SLIDES = [
  {
    imageUrl: 'https://placehold.co/1200x600/8b8578/fff?text=Living+Collection',
    subtitle: 'New Arrivals',
    title: 'Dream Spaces: Your Imagination,\nOur Blueprint',
    description: '?꾩꽑??而щ젆?섏쑝濡??섎쭔??怨듦컙???꾩꽦?섏꽭??',
  },
  {
    imageUrl: 'https://placehold.co/1200x600/6b7b6b/fff?text=Summer+Edit',
    subtitle: 'Summer 2026',
    title: 'Fresh Picks\nfor the Season',
    description: '?щ쫫??留욎븘 以鍮꾪븳 ?쒖쫵 ?쒖젙 而щ젆?섏쓣 留뚮굹蹂댁꽭??',
  },
  {
    imageUrl: 'https://placehold.co/1200x600/7b6b78/fff?text=Best+Sellers',
    subtitle: 'Best Sellers',
    title: 'Most Loved\nby Our Customers',
    description: '媛??留롮? ?щ옉??諛쏆? ?멸린 ?꾩씠?쒖쓣 ?뺤씤?섏꽭??',
  },
];

// ?? ?섏씠吏 ??

export function HomeClient() {
  const { selectedCategory, filterProducts } = useProductFilter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    void fetch('/api/products')
      .then((r) => r.json())
      .then((raw: unknown) => {
        const data = ProductListResponseSchema.parse(raw);
        if (!ignore) {
          setProducts(data.products);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Hero ?먮룞 ?щ씪?대뱶
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleHeroPrev = () => {
    setHeroIndex(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  };

  const handleHeroNext = () => {
    setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // 移댄뀒怨좊━蹂?????대?吏 (泥?踰덉㎏ ?곹뭹 ?대?吏 ?ъ슜)
  const categoryImages = CATEGORIES.filter((c) => c.key !== 'all').map((c) => {
    const firstProduct = products.find((p) => p.category === c.key);
    return {
      ...c,
      imageUrl:
        firstProduct?.imageUrl ??
        `https://placehold.co/200x200/ddd/999?text=${c.label}`,
    };
  });

  // 移댄뀒怨좊━ ?꾪꽣 ?곸슜
  const filtered = filterProducts(products);

  // 理쒖떊 ?곹뭹 (移댄뀒怨좊━ ?꾪꽣 ?곸슜 ??createdAt 湲곗? ?뺣젹)
  const latestProducts = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // ?좎씤 ?곹뭹
  const saleProducts = products.filter((p) => p.originalPrice && p.stock > 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
          <p className="font-family-body text-sm text-text-secondary">
            ?곹뭹??遺덈윭?ㅻ뒗 以?..
          </p>
        </div>
      </div>
    );
  }

  const currentSlide = HERO_SLIDES[heroIndex];

  return (
    <>
      {/* ?? Hero 諛곕꼫 ?? */}
      <section className="relative overflow-hidden bg-bg-card" ref={heroRef}>
        <div className="relative h-[420px] md:h-[520px]">
          {/* 諛곌꼍 ?대?吏 */}
          <img
            src={currentSlide.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-opacity duration-700"
          />
          {/* ?ㅻ쾭?덉씠 */}
          <div className="absolute inset-0 bg-gradient-to-r from-text/60 via-text/30 to-transparent" />

          {/* ?띿뒪??*/}
          <div className="relative mx-auto flex h-full max-w-5xl items-center px-8">
            <div className="max-w-lg">
              <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-white/80">
                {currentSlide.subtitle}
              </p>
              <h2 className="mt-4 font-family-display text-3xl leading-tight font-light text-white md:text-[42px] md:leading-[1.2]">
                {currentSlide.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-white/80">
                {currentSlide.description}
              </p>
              <div className="mt-7 flex gap-3">
                <Link
                  href="#latest"
                  className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-[13px] font-semibold text-text transition-colors hover:bg-white/90"
                >
                  Shop Now
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex h-11 items-center rounded-lg border border-white/50 px-6 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          {/* 醫뚯슦 ?붿궡??*/}
          <button
            onClick={handleHeroPrev}
            className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            aria-label="?댁쟾 ?щ씪?대뱶"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleHeroNext}
            className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
            aria-label="?ㅼ쓬 ?щ씪?대뱶"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* ?몃뵒耳?댄꽣 */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`?щ씪?대뱶 ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ?? Shop by Categories ?? */}
      <section id="categories" className="mx-auto max-w-5xl px-8 py-14">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-family-display text-xl font-normal text-text">
            Shop by Categories
          </h2>
          <Link
            href="/#latest"
            className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categoryImages.map((cat) => (
            <Link
              key={cat.key}
              href={`/?category=${cat.key}`}
              scroll={false}
              className="group flex flex-col items-center gap-3"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-bg">
                <img
                  src={cat.imageUrl}
                  alt={cat.label}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-[13px] font-medium text-text-secondary transition-colors group-hover:text-text">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ?? Latest Arrivals ?? */}
      <section id="latest" className="bg-bg-card py-14">
        <div className="mx-auto max-w-5xl px-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-family-display text-xl font-normal text-text">
              {selectedCategory === 'all'
                ? 'Latest Arrivals'
                : CATEGORY_LABEL[selectedCategory]}
            </h2>
            <span className="text-[13px] text-text-caption">
              珥?{filtered.length}嫄?{' '}
            </span>
          </div>

          {/* 移댄뀒怨좊━ ?꾪꽣 ??*/}
          <nav className="mb-8 flex gap-2.5 overflow-x-auto">
            {CATEGORIES.map(({ key, label }) => (
              <Link
                key={key}
                href={key === 'all' ? '/' : `/?category=${key}`}
                scroll={false}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-text text-white'
                    : 'bg-bg text-text-secondary hover:text-text'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
            {latestProducts.map((product) => {
              const discount = product.originalPrice
                ? calcDiscount(product.originalPrice, product.price)
                : 0;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group"
                >
                  {/* ?대?吏 */}
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-bg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.stock === 0 && (
                      <div className="absolute right-3 top-3">
                        <span className="rounded-full bg-text/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Sold Out
                        </span>
                      </div>
                    )}
                    {discount > 0 && product.stock > 0 && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full bg-discount px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          -{discount}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ?뺣낫 */}
                  <div className="mt-3.5 px-0.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-text-caption">
                      {CATEGORY_LABEL[product.category]}
                    </span>
                    <h3 className="mt-1 truncate text-[14px] font-medium text-text">
                      {product.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1">
                      <StarIcon className="size-3 text-amber-500" />
                      <span className="text-[11px] text-text-secondary">
                        {product.rating}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] font-semibold text-text">
                      {formatWon(product.price)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-[12px] text-text-caption line-through">
                        {formatWon(product.originalPrice)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ?? ?꾨줈紐?諛곕꼫 ?? */}
      {saleProducts.length > 0 && (
        <section className="mx-auto max-w-5xl px-8 py-14">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-light via-bg to-brand-light p-10 md:p-14">
            <div className="relative z-10 max-w-md">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-accent">
                Sale
              </p>
              <h2 className="mt-3 font-family-display text-2xl font-normal leading-snug text-text md:text-3xl">
                Limited Time,
                <br />
                Unbeatable Savings
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                理쒕?{' '}
                {Math.max(
                  ...saleProducts.map((p) =>
                    calcDiscount(p.originalPrice ?? 0, p.price),
                  ),
                )}
                % ?좎씤 以묒씤 ?곹뭹??留뚮굹蹂댁꽭??
              </p>
              <Link
                href="/?category=all"
                className="mt-6 inline-flex h-11 items-center rounded-lg bg-text px-6 text-[13px] font-semibold text-white transition-colors hover:bg-text/90"
              >
                ?좎씤 ?곹뭹 蹂닿린
              </Link>
            </div>
            {/* ?μ떇 ?붿냼 */}
            <div className="absolute -right-8 -top-8 size-48 rounded-full bg-accent/10" />
            <div className="absolute -bottom-6 right-24 size-32 rounded-full bg-brand/10" />

            {/* Sale 諭껋? */}
            <div className="absolute bottom-6 right-8 rotate-12">
              <div className="flex size-20 items-center justify-center rounded-full bg-accent text-[18px] font-bold text-white shadow-lg md:size-24 md:text-[22px]">
                Sale
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
