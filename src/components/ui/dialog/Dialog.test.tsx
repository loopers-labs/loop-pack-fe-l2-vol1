import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '@/components/ui/dialog/Dialog';

type DialogRootProps = Omit<ComponentProps<typeof Dialog>, 'children'>;

// 데모와 같은 조립. overlay는 스타일이 없어 role이 없으므로 testid로 잡는다
function renderDialog(rootProps: DialogRootProps = {}) {
  return render(
    <Dialog {...rootProps}>
      <Dialog.Trigger>열기</Dialog.Trigger>
      <Dialog.Overlay data-testid="overlay" />
      <Dialog.Content data-testid="content">
        <Dialog.Title>제목</Dialog.Title>
        <Dialog.Description>설명</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>,
  );
}

describe('열고 닫기 (uncontrolled)', () => {
  it('처음에는 닫혀 있고 트리거를 클릭하면 Title과 Description이 보인다', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.queryByText('제목')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '열기' }));

    expect(screen.getByRole('heading', { name: '제목' })).toBeInTheDocument();
    expect(screen.getByText('설명')).toBeInTheDocument();
  });

  it('defaultOpen이 true이면 처음부터 열려 있다', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByText('제목')).toBeInTheDocument();
  });

  it('Close 클릭으로 닫힌다', async () => {
    const user = userEvent.setup();
    renderDialog({ defaultOpen: true });

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });

  it('Esc로 닫힌다', async () => {
    const user = userEvent.setup();
    renderDialog({ defaultOpen: true });

    await user.keyboard('{Escape}');

    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });

  it('overlay 클릭으로 닫힌다', async () => {
    const user = userEvent.setup();
    renderDialog({ defaultOpen: true });

    await user.click(screen.getByTestId('overlay'));

    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });

  it('content 내부 클릭으로는 닫히지 않는다', async () => {
    const user = userEvent.setup();
    renderDialog({ defaultOpen: true });

    await user.click(screen.getByText('제목'));

    expect(screen.getByText('제목')).toBeInTheDocument();
  });

  it('닫고 다시 열어도 Esc와 overlay 닫기가 다시 동작한다', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: '열기' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByText('제목')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '열기' }));
    expect(screen.getByText('제목')).toBeInTheDocument();

    await user.click(screen.getByTestId('overlay'));
    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });

  it('중첩 Dialog에서 Esc는 맨 위 자식만 닫고 부모는 유지한다', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <Dialog.Content>
          <Dialog.Title>부모</Dialog.Title>
          <Dialog>
            <Dialog.Trigger>자식 열기</Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>자식</Dialog.Title>
            </Dialog.Content>
          </Dialog>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: '자식 열기' }));
    expect(screen.getByText('자식')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('자식')).not.toBeInTheDocument();
    expect(screen.getByText('부모')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText('부모')).not.toBeInTheDocument();
  });

  it('부모 리렌더로 아래 Dialog의 onOpenChange 참조가 바뀌어도 Esc는 맨 위를 닫는다', async () => {
    const user = userEvent.setup();
    const bottomSpy = vi.fn();
    const topSpy = vi.fn();

    const renderPair = (bottomHandler: (open: boolean) => void) => (
      <>
        <Dialog open onOpenChange={bottomHandler}>
          <Dialog.Content>아래</Dialog.Content>
        </Dialog>
        <Dialog open onOpenChange={topSpy}>
          <Dialog.Content>위</Dialog.Content>
        </Dialog>
      </>
    );

    const { rerender } = render(renderPair(bottomSpy));
    rerender(renderPair((open) => bottomSpy(open)));

    await user.keyboard('{Escape}');

    expect(topSpy).toHaveBeenCalledWith(false);
    expect(bottomSpy).not.toHaveBeenCalled();
  });
});

describe('controlled 계약', () => {
  it('open이 단일 출처다 — open 고정 시 Close를 눌러도 닫히지 않고 onOpenChange(false)만 호출된다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('닫힘 경로(Close/Esc/overlay)가 모두 onOpenChange(false)를 호출한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('overlay'));

    expect(onOpenChange).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(3, false);
  });

  it('닫힌 상태에서 Trigger를 누르면 onOpenChange(true)만 호출되고 스스로 열리지 않는다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: false, onOpenChange });

    await user.click(screen.getByRole('button', { name: '열기' }));

    expect(screen.queryByText('제목')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('open prop이 있으면 defaultOpen보다 controlled open 값이 우선한다', () => {
    renderDialog({ open: false, defaultOpen: true });

    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });
});

describe('Portal과 scroll lock', () => {
  it('Overlay와 Content는 document.body 직속으로 렌더된다', () => {
    const { container } = renderDialog({ defaultOpen: true });

    expect(screen.getByTestId('overlay').parentElement).toBe(document.body);
    expect(screen.getByTestId('content').parentElement).toBe(document.body);
    expect(container).not.toContainElement(screen.getByTestId('content'));
  });

  it('열리면 html/body 스크롤이 잠기고 닫히면 각자의 원래 값으로 복구된다', async () => {
    const user = userEvent.setup();
    document.documentElement.style.overflow = 'clip';
    document.body.style.overflow = 'auto';
    renderDialog();

    await user.click(screen.getByRole('button', { name: '열기' }));

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');

    expect(document.documentElement.style.overflow).toBe('clip');
    expect(document.body.style.overflow).toBe('auto');

    document.documentElement.style.overflow = '';
  });

  it('여러 Dialog가 겹쳐 열리면 닫는 순서와 무관하게 마지막 Dialog가 닫힐 때 복구된다', () => {
    document.body.style.overflow = 'auto';

    const renderPair = (aOpen: boolean, bOpen: boolean) => (
      <>
        <Dialog open={aOpen}>
          <Dialog.Content>A</Dialog.Content>
        </Dialog>
        <Dialog open={bOpen}>
          <Dialog.Content>B</Dialog.Content>
        </Dialog>
      </>
    );

    const { rerender } = render(renderPair(true, true));

    expect(document.body.style.overflow).toBe('hidden');

    // 먼저 연 A부터 닫는다 — 인스턴스별 저장 방식이 깨지던 순서
    rerender(renderPair(false, true));

    expect(document.body.style.overflow).toBe('hidden');

    rerender(renderPair(false, false));

    expect(document.body.style.overflow).toBe('auto');
  });

  it('열린 채 unmount되어도 스크롤 잠금이 해제된다', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = renderDialog({ defaultOpen: true });

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('scroll');
  });

  it('unmount 후 Esc를 눌러도 리스너가 남아 있지 않다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = renderDialog({ open: true, onOpenChange });

    unmount();
    await user.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('확장 지점', () => {
  it('사용처 onClick이 먼저 실행되고 preventDefault하면 닫기가 취소된다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <Dialog defaultOpen>
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
          <Dialog.Close onClick={onClick}>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('제목')).toBeInTheDocument();
  });

  it('Trigger onClick에서 preventDefault하면 열리지 않는다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <Dialog>
        <Dialog.Trigger onClick={onClick}>열기</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: '열기' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText('제목')).not.toBeInTheDocument();
  });

  it('Overlay onClick에서 preventDefault하면 닫히지 않는다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());

    render(
      <Dialog defaultOpen>
        <Dialog.Overlay data-testid="overlay" onClick={onClick} />
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByTestId('overlay'));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('제목')).toBeInTheDocument();
  });

  it('Trigger는 기본 type="button"이라 form submit을 일으키지 않는다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.SubmitEvent) =>
      event.preventDefault(),
    );

    render(
      <form onSubmit={onSubmit}>
        <Dialog>
          <Dialog.Trigger>열기</Dialog.Trigger>
          <Dialog.Overlay data-testid="overlay" />
          <Dialog.Content>
            <Dialog.Title>제목</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '열기' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('제목')).toBeInTheDocument();
  });

  it('Dialog 밖에서 하위 컴포넌트를 쓰면 에러를 던진다', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<Dialog.Close>닫기</Dialog.Close>)).toThrow(
      'Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다.',
    );

    consoleError.mockRestore();
  });
});
