'use client';

import { Dialog } from '@/components/ui/dialog';
import { useState } from 'react';

export function DialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 pt-10">
      {/* Uncontrolled */}
      <div>
        <p className="mb-2 text-sm font-bold text-gray-500">Uncontrolled</p>
        <Dialog>
          <Dialog.Trigger>열기</Dialog.Trigger>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>베이글 주문 확인</Dialog.Title>
            <Dialog.Description>
              선택하신 옵션으로 주문을 진행할까요?
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close>
                <span className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500">
                  취소
                </span>
              </Dialog.Close>
              <Dialog.Close>
                <span className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white">
                  확인
                </span>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog>
      </div>

      {/* Controlled */}
      <div>
        <p className="mb-2 text-sm font-bold text-gray-500">Controlled</p>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>열기</Dialog.Trigger>
            <Dialog.Overlay />
            <Dialog.Content>
              <Dialog.Title>베이글 주문 확인</Dialog.Title>
              <Dialog.Description>
                선택하신 옵션으로 주문을 진행할까요?
              </Dialog.Description>
              <div className="flex justify-end gap-2">
                <Dialog.Close>
                  <span className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500">
                    취소
                  </span>
                </Dialog.Close>
                <Dialog.Close>
                  <span className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white">
                    확인
                  </span>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog>
          <button type="button" onClick={() => setOpen(false)}>
            외부에서 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
