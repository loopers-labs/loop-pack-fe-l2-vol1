'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ProductDetailError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-text-secondary">
          {error.message || '상품을 불러올 수 없습니다.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text transition-colors hover:bg-bg"
          >
            다시 시도
          </button>
          <Link
            href="/products"
            className="rounded-lg border border-border px-4 py-2 text-sm text-text transition-colors hover:bg-bg"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
