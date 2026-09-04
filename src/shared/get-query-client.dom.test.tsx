import { useMutation, useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './api-client';
import { getQueryClient } from './get-query-client';

import { renderWithProviders } from '@tests/render-with-providers';

const unauthorized = () => new ApiError(401, '로그인이 필요합니다.');
const serverFailure = () =>
  new ApiError(500, '주문 정보를 처리하지 못했습니다.');

// jsdom은 window가 있어 브라우저 client가 만들어진다. 싱글턴이라 테스트 간 캐시만 비운다.
afterEach(() => {
  getQueryClient().clear();
});

it('브라우저에서는 같은 QueryClient를 재사용한다', () => {
  expect(getQueryClient()).toBe(getQueryClient());
});

class Boundary extends Component<
  { children: ReactNode },
  { message?: string }
> {
  state: { message?: string } = {};

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    return this.state.message ? (
      <p role="alert">{this.state.message}</p>
    ) : (
      this.props.children
    );
  }
}

function OrdersScreen({ queryFn }: { queryFn: () => Promise<unknown> }) {
  const { isError, error } = useQuery({
    queryKey: ['orders'],
    queryFn,
    retryDelay: 0,
  });

  return isError ? <p>화면 처리: {error.message}</p> : <p>조회 중</p>;
}

function OrderButton({ mutationFn }: { mutationFn: () => Promise<unknown> }) {
  const { mutate, isError, error } = useMutation({ mutationFn });

  return (
    <>
      <button type="button" onClick={() => mutate()}>
        주문
      </button>
      {isError && <p>화면 처리: {error.message}</p>}
    </>
  );
}

const renderInBoundary = (ui: ReactNode) =>
  renderWithProviders(<Boundary>{ui}</Boundary>, {
    queryClient: getQueryClient(),
  });

describe('에러 경계 전달 정책', () => {
  // 경계가 잡은 오류도 React가 console.error로 남기므로 테스트 출력에서만 숨긴다.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('query의 401은 재시도하지 않고 에러 경계로 던진다', async () => {
    const queryFn = vi.fn().mockRejectedValue(unauthorized());

    renderInBoundary(<OrdersScreen queryFn={queryFn} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인이 필요합니다.',
    );
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('query의 401이 아닌 실패는 2회 재시도한 뒤 화면이 인라인으로 처리한다', async () => {
    const queryFn = vi.fn().mockRejectedValue(serverFailure());

    renderInBoundary(<OrdersScreen queryFn={queryFn} />);

    expect(
      await screen.findByText('화면 처리: 주문 정보를 처리하지 못했습니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('mutation의 401은 재시도 없이 에러 경계로 던진다', async () => {
    const mutationFn = vi.fn().mockRejectedValue(unauthorized());

    const { user } = renderInBoundary(<OrderButton mutationFn={mutationFn} />);

    await user.click(screen.getByRole('button', { name: '주문' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인이 필요합니다.',
    );
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it('mutation의 401이 아닌 실패는 화면이 인라인으로 처리한다', async () => {
    const { user } = renderInBoundary(
      <OrderButton mutationFn={() => Promise.reject(serverFailure())} />,
    );

    await user.click(screen.getByRole('button', { name: '주문' }));

    expect(
      await screen.findByText('화면 처리: 주문 정보를 처리하지 못했습니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
