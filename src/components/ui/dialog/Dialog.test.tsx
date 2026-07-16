import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Dialog } from '.';

// ── 테스트 헬퍼 ──

function UncontrolledDialog() {
  return (
    <Dialog>
      <Dialog.Trigger>
        <span>열기</span>
      </Dialog.Trigger>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Title>테스트 제목</Dialog.Title>
        <Dialog.Description>테스트 설명</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

function ControlledDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button data-testid="external-open" onClick={() => setIsOpen(true)}>
        외부 열기
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger>
          <span>열기</span>
        </Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Controlled</Dialog.Title>
          <Dialog.Description>설명</Dialog.Description>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

function CustomClassNameDialog() {
  return (
    <Dialog>
      <Dialog.Trigger>
        <span>열기</span>
      </Dialog.Trigger>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
      <Dialog.Content className="fixed inset-0 z-[51] flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-7">
          <Dialog.Title>Custom Dialog</Dialog.Title>
          <Dialog.Close>닫기</Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

// ── 테스트 ──

describe('Dialog', () => {
  describe('Uncontrolled', () => {
    it('초기에는 Content가 렌더되지 않는다', () => {
      render(<UncontrolledDialog />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Trigger 클릭으로 열린다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      await user.click(screen.getByText('열기'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('테스트 제목')).toBeInTheDocument();
      expect(screen.getByText('테스트 설명')).toBeInTheDocument();
    });

    it('Close 버튼으로 닫힌다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      await user.click(screen.getByText('열기'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByText('닫기'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Escape 키로 닫힌다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      await user.click(screen.getByText('열기'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('열려 있는 동안 배경 스크롤이 잠긴다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      expect(document.body.style.overflow).not.toBe('hidden');

      await user.click(screen.getByText('열기'));
      expect(document.body.style.overflow).toBe('hidden');

      await user.click(screen.getByText('닫기'));
      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('Controlled', () => {
    it('open=false이면 Content가 렌더되지 않는다', () => {
      render(<ControlledDialog />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('외부 버튼으로 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<ControlledDialog />);

      await user.click(screen.getByTestId('external-open'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Close 버튼으로 닫힌다', async () => {
      const user = userEvent.setup();
      render(<ControlledDialog />);

      await user.click(screen.getByTestId('external-open'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByText('닫기'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('onOpenChange가 호출된다', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Dialog open={false} onOpenChange={handleOpenChange}>
          <Dialog.Trigger>
            <span>열기</span>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Test</Dialog.Title>
          </Dialog.Content>
        </Dialog>,
      );

      await user.click(screen.getByText('열기'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Compound 조립', () => {
    it('Title이 h2로 렌더된다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      await user.click(screen.getByText('열기'));
      const title = screen.getByText('테스트 제목');
      expect(title.tagName).toBe('H2');
    });

    it('Content에 role=dialog, aria-modal=true가 있다', async () => {
      const user = userEvent.setup();
      render(<UncontrolledDialog />);

      await user.click(screen.getByText('열기'));
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('custom className을 넘겨도 overlay 클릭으로 닫힌다', async () => {
      const user = userEvent.setup();
      render(<CustomClassNameDialog />);

      await user.click(screen.getByText('열기'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // overlay 영역 클릭 (Dialog.Overlay에 해당)
      const overlay = document.querySelector('.fixed.inset-0.z-50');
      expect(overlay).toBeInTheDocument();
      await user.click(overlay as HTMLElement);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Context 밖에서 사용하면 에러를 던진다', () => {
      // console.error 억제
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<Dialog.Close>닫기</Dialog.Close>);
      }).toThrow('Dialog 하위 컴포넌트는 <Dialog> 안에서 사용해야 합니다.');

      spy.mockRestore();
    });
  });
});
