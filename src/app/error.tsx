'use client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl border-y border-border bg-bg-card px-6 py-14 text-center">
        <p className="text-sm text-text-secondary">
          {error.message || '오류가 발생했습니다.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-lg border border-border px-5 text-sm font-semibold text-text transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
