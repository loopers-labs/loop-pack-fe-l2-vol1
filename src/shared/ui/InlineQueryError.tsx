type InlineQueryErrorProps = {
  readonly message: string
  readonly isRetrying: boolean
  readonly onRetry: () => void
}

export function InlineQueryError({
  message,
  isRetrying,
  onRetry,
}: InlineQueryErrorProps) {
  const retryLabel = isRetrying ? '다시 불러오는 중…' : '다시 시도'

  const handleRetry = () => {
    if (isRetrying) {
      return
    }

    onRetry()
  }

  return (
    <div
      role="alert"
      aria-atomic="true"
      aria-busy={isRetrying}
      className="flex flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface-muted) px-6 py-12 text-center"
    >
      <p className="text-sm text-(--color-muted)">{message}</p>
      <button
        type="button"
        aria-label={retryLabel}
        aria-disabled={isRetrying}
        onClick={handleRetry}
        className="min-h-10 min-w-40 rounded border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-bold text-(--color-text) hover:bg-(--color-surface-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ink) aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      >
        <span className="grid">
          <span
            aria-hidden="true"
            className={`col-start-1 row-start-1 ${isRetrying ? 'invisible' : ''}`}
          >
            다시 시도
          </span>
          <span
            aria-hidden="true"
            className={`col-start-1 row-start-1 ${isRetrying ? '' : 'invisible'}`}
          >
            다시 불러오는 중…
          </span>
        </span>
      </button>
    </div>
  )
}
