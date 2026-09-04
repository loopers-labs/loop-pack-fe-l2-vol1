import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  SessionProvider,
  useSessionActions,
  useSessionUser,
} from './session-store';
import type { SessionUser } from './types';

const LOOPER1: SessionUser = {
  id: 'u1',
  name: '루퍼1',
  email: 'looper1@loopers.dev',
};
const LOOPER2: SessionUser = {
  id: 'u2',
  name: '루퍼2',
  email: 'looper2@loopers.dev',
};

function SessionMenu({ label }: { label: string }) {
  const user = useSessionUser();
  const { setUser, clearUser } = useSessionActions();

  return (
    <section aria-label={label}>
      <p>{user ? `${user.name} ${user.email}` : '비로그인'}</p>
      <button type="button" onClick={() => setUser(LOOPER2)}>
        루퍼2로 로그인
      </button>
      <button type="button" onClick={clearUser}>
        로그아웃
      </button>
    </section>
  );
}

describe('SessionProvider', () => {
  // 정적 마크업은 effect를 돌리지 않는다. 여기에 이름이 있다는 건 초기 HTML부터 로그인 상태라는 뜻이다.
  it('서버가 준 초기 사용자를 첫 HTML부터 반영한다', () => {
    expect(
      renderToStaticMarkup(
        <SessionProvider initialUser={LOOPER1}>
          <SessionMenu label="헤더" />
        </SessionProvider>,
      ),
    ).toContain('루퍼1 looper1@loopers.dev');
    expect(
      renderToStaticMarkup(
        <SessionProvider initialUser={null}>
          <SessionMenu label="헤더" />
        </SessionProvider>,
      ),
    ).toContain('비로그인');
  });

  it('setUser와 clearUser가 구독 화면을 즉시 바꾼다', async () => {
    const user = userEvent.setup();

    render(
      <SessionProvider initialUser={null}>
        <SessionMenu label="헤더" />
      </SessionProvider>,
    );

    await user.click(screen.getByRole('button', { name: '루퍼2로 로그인' }));

    expect(screen.getByText('루퍼2 looper2@loopers.dev')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(screen.getByText('비로그인')).toBeInTheDocument();
  });

  it('Provider마다 store가 따로라 한쪽을 비워도 다른 쪽은 유지된다', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SessionProvider initialUser={LOOPER1}>
          <SessionMenu label="요청 A" />
        </SessionProvider>
        <SessionProvider initialUser={LOOPER1}>
          <SessionMenu label="요청 B" />
        </SessionProvider>
      </>,
    );
    const requestA = screen.getByRole('region', { name: '요청 A' });
    const requestB = screen.getByRole('region', { name: '요청 B' });

    await user.click(
      within(requestA).getByRole('button', { name: '로그아웃' }),
    );

    expect(within(requestA).getByText('비로그인')).toBeInTheDocument();
    expect(
      within(requestB).getByText('루퍼1 looper1@loopers.dev'),
    ).toBeInTheDocument();
  });

  it('Provider 밖에서 쓰면 안내 오류를 던진다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<SessionMenu label="헤더" />)).toThrow(
      'SessionProvider 안에서만 사용할 수 있습니다.',
    );
  });
});
