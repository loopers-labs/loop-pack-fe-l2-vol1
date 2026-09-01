// @vitest-environment jsdom

import '@/test/setupDom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '.';

function TestDialog() {
  return (
    <Dialog>
      <Dialog.Trigger>열기</Dialog.Trigger>
      <Dialog.Overlay className="custom-overlay" />
      <Dialog.Content className="custom-content">
        <Dialog.Title>테스트 제목</Dialog.Title>
        <Dialog.Description>테스트 설명</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

function ControlledDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger>열기</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Controlled</Dialog.Title>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('열리면 접근성 정보와 className을 전달하고 overlay로 닫으며 스크롤을 복구한다', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '열기' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('custom-content');
    expect(screen.getByRole('heading', { name: '테스트 제목' }).tagName).toBe(
      'H2',
    );
    expect(screen.getByText('테스트 설명')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toHaveClass('custom-overlay');
    await user.click(overlay as HTMLElement);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('Close 버튼과 Escape 키로 닫는다', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);
    const openButton = screen.getByRole('button', { name: '열기' });

    await user.click(openButton);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(openButton);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('controlled 모드에서는 열기와 닫기 요청을 외부에 알린다', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const view = render(
      <ControlledDialog open={false} onOpenChange={handleOpenChange} />,
    );

    await user.click(screen.getByRole('button', { name: '열기' }));
    expect(handleOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.rerender(
      <ControlledDialog open onOpenChange={handleOpenChange} />,
    );
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(handleOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('하위 컴포넌트를 Dialog 밖에서 사용하면 조립 오류를 알린다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Dialog.Close>닫기</Dialog.Close>)).toThrow(
      'Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다.',
    );

    consoleError.mockRestore();
  });
});
