'use client';

import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { productListQueryOptions } from '@/queries/productQueries';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useProductSearchParams } from '../_hooks/useProductSearchParams';
import type { Product, ProductListResponse } from '@/types/commerce';

function ProductActions({ product }: { product: Product }) {
  const isWished = useWishlistStore((s) => s.ids.has(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={() => toggle(product.id)}
        className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
          isWished
            ? 'border-accent text-accent'
            : 'border-border text-text-secondary hover:bg-bg'
        }`}
      >
        {isWished ? '찜 해제' : '찜'}
      </button>
      <button
        type="button"
        onClick={() =>
          addItem({
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
          })
        }
        className="rounded-lg border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-bg"
      >
        담기
      </button>
    </div>
  );
}

interface ProductGridProps {
  data: ProductListResponse;
  isFetching: boolean;
  setPage: (page: number) => void;
}

function ProductGrid({ data, isFetching, setPage }: ProductGridProps) {
  const { products, totalCount, page, pageSize } = data;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <p className="mt-6 text-sm text-text-caption">
        총 {totalCount}개
        {isFetching && (
          <span className="ml-2 text-text-caption">불러오는 중...</span>
        )}
      </p>

      {products.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-sm text-text-secondary">상품이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
          {products.map((product) => (
            <article key={product.id} className="group">
              <Link href={`/products/${product.id}`}>
                <div className="aspect-square overflow-hidden rounded-xl bg-bg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </div>
                <p className="mt-2 text-[11px] text-text-caption">
                  {product.brand}
                </p>
                <h2 className="mt-1 truncate text-sm text-text">
                  {product.name}
                </h2>
                <strong className="mt-1 block text-sm font-semibold text-text">
                  {product.price.toLocaleString('ko-KR')}원
                </strong>
                {product.originalPrice && (
                  <span className="text-xs text-text-caption line-through">
                    {product.originalPrice.toLocaleString('ko-KR')}원
                  </span>
                )}
              </Link>
              <ProductActions product={product} />
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-text-secondary">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}

export function ProductListContent() {
  const { params, query, setCategory, setSort, setSearch, setPage } =
    useProductSearchParams();

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching } = useQuery({
    ...productListQueryOptions(query),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!data) return;
    const totalPages = Math.ceil(data.totalCount / data.pageSize);
    if (data.page < totalPages) {
      void queryClient.prefetchQuery(
        productListQueryOptions({ ...query, page: data.page + 1 }),
      );
    }
  }, [data, query, queryClient]);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSearch(value);
      }, 300);
    },
    [setSearch],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-secondary">상품을 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-secondary">
          {error?.message ?? '오류가 발생했습니다.'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { categories } = data;

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="font-family-display text-2xl font-normal text-text">
        상품 목록
      </h1>

      {/* 필터 */}
      <div className="mt-6 flex flex-wrap gap-4">
        <input
          key={params.q}
          type="text"
          placeholder="상품명 또는 브랜드"
          defaultValue={params.q}
          onChange={handleSearchChange}
          className="rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text"
        />
        <select
          value={params.category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text"
        >
          <option value="all">전체</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={params.sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="price-asc">가격 낮은순</option>
          <option value="price-desc">가격 높은순</option>
        </select>
      </div>

      <ProductGrid data={data} isFetching={isFetching} setPage={setPage} />
    </main>
  );
}
