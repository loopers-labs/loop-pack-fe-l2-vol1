// [AI] render/userEvent에 DOM이 필요하므로 jsdom 환경을 명시한다.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Dialog } from './index';

const user = userEvent.setup();

const renderDialog = (overrides: { open?: boolean; defaultOpen?: boolean } = {}) => {
  const onOpenChange = vi.fn();
  const utils = render(
    <Dialog open={overrides.open} defaultOpen={overrides.defaultOpen} onOpenChange={onOpenChange}>
      <Dialog.Trigger data-testid="trigger">열기</Dialog.Trigger>
      <Dialog.Overlay data-testid="overlay" />
      <Dialog.Content data-testid="content">
        <Dialog.Title>제목</Dialog.Title>
        <Dialog.Description>설명</Dialog.Description>
        <Dialog.Close data-testid="close">닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
  return { ...utils, onOpenChange };
};

describe('Dialog — uncontrolled', () => {
  it('초기엔 닫혀있고 Trigger 클릭으로 열린다', async () => {
    renderDialog();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });

  it('Close 클릭으로 닫힌다', async () => {
    renderDialog();
    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('defaultOpen=true 면 마운트 시 열려있다', () => {
    renderDialog({ defaultOpen: true });
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('Overlay 클릭으로 닫힌다', async () => {
    renderDialog();
    await user.click(screen.getByTestId('trigger'));
    await user.click(screen.getByTestId('overlay'));
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('Escape 키로 닫힌다', async () => {
    renderDialog();
    await user.click(screen.getByTestId('trigger'));
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });
});

describe('Dialog — controlled', () => {
  const ControlledDialog = () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger data-testid="trigger">열기</Dialog.Trigger>
        <Dialog.Content data-testid="content">
          <Dialog.Close data-testid="close">닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    );
  };

  it('부모 상태로 열고닫기가 동작한다', async () => {
    render(<ControlledDialog />);
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeInTheDocument();
    await user.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('onOpenChange 가 open 전환 시 호출된다 (uncontrolled)', async () => {
    const { onOpenChange } = renderDialog();
    await user.click(screen.getByTestId('trigger'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe('Dialog — 스크롤 잠금 (useIsomorphicLayoutEffect)', () => {
  it('열려있는 동안 html.overflow 가 hidden 이다', async () => {
    renderDialog();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
    await user.click(screen.getByTestId('trigger'));
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('닫히면 overflow 가 원래값으로 복원된다', async () => {
    renderDialog();
    document.documentElement.style.overflow = 'visible';
    await user.click(screen.getByTestId('trigger'));
    expect(document.documentElement.style.overflow).toBe('hidden');
    await user.click(screen.getByTestId('close'));
    expect(document.documentElement.style.overflow).toBe('visible');
  });
});

afterEach(() => {
  cleanup();
  // 테스트 간 html 스타일이 누수되지 않도록 정리
  document.documentElement.style.overflow = '';
});
