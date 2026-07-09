'use client';

import { useState } from 'react';

import { Dialog } from './Dialog';

const overlayClassName = 'fixed inset-0 bg-black/40';
const contentClassName =
  'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6';

function UncontrolledDialogDemo() {
  return (
    <Dialog>
      <Dialog.Trigger>Dialog 열기</Dialog.Trigger>

      <Dialog.Overlay className={overlayClassName} />

      <Dialog.Content className={contentClassName}>
        <Dialog.Title>Dialog Content</Dialog.Title>
        <Dialog.Description>Portal로 렌더되는 Dialog입니다.</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

function ControlledDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p>외부 상태: {open ? '열림' : '닫힘'}</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>controlled Dialog 열기</Dialog.Trigger>

        <Dialog.Overlay className={overlayClassName} />

        <Dialog.Content className={contentClassName}>
          <Dialog.Title>Controlled Dialog</Dialog.Title>
          <Dialog.Description>
            외부 state로 open 상태를 제어하는 Dialog입니다.
          </Dialog.Description>

          <p>현재 상태: {open ? '열림' : '닫힘'}</p>

          <button onClick={() => setOpen(false)}>외부 버튼으로 닫기</button>
          <Dialog.Close>Dialog.Close로 닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

export function DialogDemo() {
  return (
    <section>
      <h2>Dialog Demo</h2>

      <UncontrolledDialogDemo />
      <ControlledDialogDemo />
    </section>
  );
}
