import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RootError from './error';

/* AI-generated : week06-fsd.md 9단계 기준 — 자기 전용 error.tsx가 없는 라우트를 위한 최상위 catch-all의 fallback UI·reset 호출만 검증 */
describe('RootError', () => {
  it('예상 못한 오류 메시지를 보여준다', () => {
    render(<RootError error={new Error('boom')} reset={() => {}} />);

    expect(screen.getByRole('alert').textContent).toBe('문제가 발생했습니다.');
  });

  it('다시 시도 버튼을 누르면 reset을 호출한다', () => {
    const reset = vi.fn();
    render(<RootError error={new Error('boom')} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
