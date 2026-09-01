import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { LogoutButton } from './LogoutButton';

/**
 * 로그아웃 버튼 (통합)
 * 중복 요청 여부만 테스트한다.
 */
const clickLogout = () => userEvent.setup().click(screen.getByRole('button', { name: '로그아웃' }));

describe('로그아웃 버튼', () => {
  it('응답을 기다리는 동안에는 다시 누를 수 없다', async () => {
    server.use(http.post('/api/auth/logout', () => delay('infinite')));

    renderWithProviders(<LogoutButton />);

    await clickLogout();

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeDisabled();
  });
});
