'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-text-secondary">
          {error.message || '상품 목록을 불러올 수 없습니다.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
