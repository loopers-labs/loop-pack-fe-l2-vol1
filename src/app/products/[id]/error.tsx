'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ProductDetailError({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl border-y border-border bg-bg-card px-6 py-14 text-center">
        <p className="text-sm text-text-secondary">
          {error.message || '상품을 불러올 수 없습니다.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg bg-text px-5 text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            다시 시도
          </button>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
