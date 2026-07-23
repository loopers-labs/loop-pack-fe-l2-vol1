'use client';

import { useQuery } from '@tanstack/react-query';

import { ProductCard } from './ProductCard';
import { toProductListQuery } from './product-list-params';
import { productQueries } from './queries';
import { usePageClamp, useProductListUrlState } from './search-params';

const countTotalPages = (totalCount: number, pageSize: number) =>
  Math.max(1, Math.ceil(totalCount / pageSize));

export function ProductList() {
  const { conditions, changePage } = useProductListUrlState();

  const { data, isPending, isError, error } = useQuery(
    productQueries.list(toProductListQuery(conditions)),
  );

  const totalPages = data
    ? countTotalPages(data.totalCount, data.pageSize)
    : null;

  const { isPageOutOfRange } = usePageClamp(totalPages);

  // 보정으로 주소가 바뀌기 전에 '99999 / 3' 같은 화면이 잠깐 보이지 않게 막는다.
  if (isPageOutOfRange) {
    return (
      <p className="week05-status" role="status">
        올바른 페이지로 이동 중입니다.
      </p>
    );
  }

  if (isPending || isPageOutOfRange) {
    return (
      <p className="week05-status" role="status">
        상품 목록을 불러오는 중입니다…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="week05-status" role="alert">
        {error.message}
      </p>
    );
  }

  return (
    <>
      <p>총 {data.totalCount}개</p>
      {data.totalCount === 0 ? (
        <p className="week05-empty">조건에 맞는 상품이 없습니다.</p>
      ) : (
        <>
          <div className="week05-grid">
            {data.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                headingLevel="h2"
              />
            ))}
          </div>
          <ProductListPagination
            page={conditions.page}
            totalPages={totalPages ?? 1}
            onPageChange={changePage}
          />
        </>
      )}
    </>
  );
}

function ProductListPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="week05-pagination" aria-label="페이지 이동">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        이전
      </button>
      <span>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        다음
      </button>
    </nav>
  );
}
