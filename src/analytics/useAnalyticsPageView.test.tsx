// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAnalyticsPageView } from './useAnalyticsPageView';

function PageViewProbe({
  isEnabled,
  onView,
  viewKey = 'default',
}: {
  isEnabled: boolean;
  onView: () => void;
  viewKey?: string;
}) {
  useAnalyticsPageView(onView, isEnabled, viewKey);
  return null;
}

describe('useAnalyticsPageView', () => {
  it('활성화된 첫 진입에만 계측하고 리렌더에는 중복 전송하지 않는다', () => {
    const onView = vi.fn();
    const { rerender } = render(
      <PageViewProbe isEnabled={false} onView={onView} />,
    );

    expect(onView).not.toHaveBeenCalled();

    rerender(<PageViewProbe isEnabled onView={onView} />);
    rerender(<PageViewProbe isEnabled onView={onView} />);

    expect(onView).toHaveBeenCalledOnce();
  });

  it('같은 컴포넌트에서 다른 상세 대상으로 이동하면 새 진입을 계측한다', () => {
    const onView = vi.fn();
    const { rerender } = render(
      <PageViewProbe isEnabled onView={onView} viewKey="p1" />,
    );

    rerender(<PageViewProbe isEnabled onView={onView} viewKey="p2" />);

    expect(onView).toHaveBeenCalledTimes(2);
  });
});
