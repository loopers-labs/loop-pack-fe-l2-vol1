import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

import { OrderNewPage } from '@/_pages/order-new';
import { SessionProvider } from '@/entities/session';
import { SESSION_USER } from '@tests/msw/fixtures';

/**
 * hasHydrated는 한 번 참이 되면 되돌릴 방법이 없다. 복원 전 화면은 아직 아무도
 * 복원을 부르지 않은 모듈에서만 만들 수 있어 파일을 따로 둔다 (store-restore 선례).
 * 페이지가 마운트 즉시 복원을 시작하므로, effect가 돌지 않는 정적 마크업으로 확인한다.
 */
it('draft 복원 전에는 주문서 대기 상태를 보여준다', () => {
  document.body.innerHTML = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider initialUser={SESSION_USER}>
        <OrderNewPage />
      </SessionProvider>
    </QueryClientProvider>,
  );

  expect(screen.getByText('주문서를 불러오는 중')).toBeInTheDocument();
  expect(screen.queryByText('주문할 상품이 없습니다')).not.toBeInTheDocument();
});
