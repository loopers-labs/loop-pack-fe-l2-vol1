'use client';

import { useEffect, useRef } from 'react';

export function useAnalyticsPageView(
  trackView: () => void,
  isEnabled = true,
  viewKey = 'default',
): void {
  const trackedViewKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isEnabled || trackedViewKey.current === viewKey) return;

    trackedViewKey.current = viewKey;
    trackView();
  }, [isEnabled, trackView, viewKey]);
}
