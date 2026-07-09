'use client';

import { Dialog } from './Dialog';

export function DialogDemo() {
  return (
    <section>
      <h2>Dialog Demo</h2>

      <Dialog>
        <Dialog.Trigger>Dialog 열기</Dialog.Trigger>

        <Dialog.Overlay>
          <div className="fixed inset-0 bg-black/40" />
        </Dialog.Overlay>

        <Dialog.Content>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6">
            <h3>Dialog Content</h3>
            <p>Portal로 렌더되는 Dialog입니다.</p>
            <Dialog.Close>닫기</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog>
    </section>
  );
}
