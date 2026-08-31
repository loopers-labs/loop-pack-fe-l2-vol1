'use client';

import { useEffect, useRef } from 'react';

interface InfiniteScrollLabels {
  loading: string;
  error: string;
  end: string;
}

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isNextPageError: boolean;
  onLoadMore: () => void;
  labels?: InfiniteScrollLabels;
}

const DEFAULT_LABELS: InfiniteScrollLabels = {
  loading: '다음 상품을 불러오는 중입니다.',
  error: '다음 상품을 불러오지 못했습니다.',
  end: '모든 상품을 확인했습니다.',
};

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  isNextPageError,
  onLoadMore,
  labels = DEFAULT_LABELS,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (
      !trigger ||
      !hasNextPage ||
      isFetchingNextPage ||
      isNextPageError ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isNextPageError, onLoadMore]);

  return (
    <div ref={triggerRef} className="mt-10 flex min-h-16 justify-center text-center">
      {isFetchingNextPage ? (
        <p role="status" className="text-sm text-text-secondary">
          {labels.loading}
        </p>
      ) : isNextPageError ? (
        <div>
          <p role="alert" className="text-sm text-text-secondary">
            {labels.error}
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            className="mt-3 min-h-11 rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            다시 시도
          </button>
        </div>
      ) : hasNextPage ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="min-h-11 rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          더 보기
        </button>
      ) : (
        <p role="status" className="text-sm text-text-caption">
          {labels.end}
        </p>
      )}
    </div>
  );
}
