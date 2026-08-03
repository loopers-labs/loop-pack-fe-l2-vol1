'use client'

import { useQueryErrorResetBoundary } from '@tanstack/react-query'

type ProductsErrorProps = {
  readonly error: Error & { readonly digest?: string }
  readonly reset: () => void
}

export default function ProductsError({
  error: _error,
  reset,
}: ProductsErrorProps) {
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  const handleReset = () => {
    queryErrorResetBoundary.reset()
    reset()
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface-muted) px-6 py-20 text-center"
      >
        <h1 className="text-2xl font-extrabold text-(--color-ink)">
          상품 목록을 표시하지{' '}
          <span className="whitespace-nowrap">못했습니다.</span>
        </h1>
        <p className="text-sm text-(--color-muted)">
          잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="min-h-10 rounded border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-bold text-(--color-text) hover:bg-(--color-surface-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink)"
        >
          다시 시도
        </button>
      </div>
    </main>
  )
}
