import { Suspense } from 'react';
import { HomeClient } from './HomeClient';

function HomeFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-brand" />
        <p className="font-family-body text-sm text-text-secondary">
          상품을 불러오는 중...
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeClient />
    </Suspense>
  );
}
