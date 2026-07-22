'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { productsQueries } from '@/queries/productsQueries';

const categoryValues = [
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
] as const;
const sortValues = ['latest', 'popular', 'price-asc', 'price-desc'] as const;

export default function ProductListPage() {
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      category: parseAsStringLiteral(categoryValues).withDefault('all'),
      sort: parseAsStringLiteral(sortValues).withDefault('latest'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'push' },
  );

  const { data, isLoading, isError } = useQuery(
    productsQueries.productList(filters),
  );

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>오류가 발생했습니다.</p>;

  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>
      <section className="week05-section">
        <h1>상품 목록</h1>
        <form className="week05-filters">
          <label>
            검색
            <input
              name="q"
              placeholder="상품명 또는 브랜드"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value, page: 1 })}
            />
          </label>
          <label>
            카테고리
            <select
              name="category"
              value={filters.category}
              onChange={(e) =>
                setFilters({
                  category: e.target.value as typeof filters.category,
                  page: 1,
                })
              }
            >
              <option value="all">전체</option>
              <option value="casual">캐주얼</option>
              <option value="fashion">패션</option>
              <option value="goods">뷰티·잡화</option>
              <option value="home">홈</option>
              <option value="digital">디지털</option>
            </select>
          </label>
          <label>
            정렬
            <select
              name="sort"
              value={filters.sort}
              onChange={(e) =>
                setFilters({
                  sort: e.target.value as typeof filters.sort,
                  page: 1,
                })
              }
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price-asc">낮은 가격순</option>
              <option value="price-desc">높은 가격순</option>
            </select>
          </label>
        </form>
      </section>
      <section className="week05-section" aria-label="상품 검색 결과">
        <p>총 {data?.totalCount ?? 0}개</p>
        <div className="week05-grid">
          {data?.products.length === 0 && <p>상품이 없습니다.</p>}
          {data?.products.map((product) => (
            <article className="week05-product" key={product.id}>
              <Image
                className="week05-image"
                src={product.image}
                alt={product.name}
                width={400}
                height={400}
              />
              <p>{product.brand}</p>
              <h2>{product.name}</h2>
              <strong>{product.price.toLocaleString()}원</strong>
              <div>
                <button
                  type="button"
                  aria-label={`${product.name} 위시리스트`}
                  aria-pressed={false}
                >
                  찜
                </button>
                <button
                  type="button"
                  aria-label={`${product.name} 장바구니`}
                  aria-pressed={false}
                >
                  담기
                </button>
              </div>
            </article>
          ))}
        </div>
        <nav className="week05-pagination" aria-label="페이지 이동">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters({ page: filters.page - 1 })}
          >
            이전
          </button>
          <span>
            {filters.page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters({ page: filters.page + 1 })}
          >
            다음
          </button>
        </nav>
      </section>
    </main>
  );
}
