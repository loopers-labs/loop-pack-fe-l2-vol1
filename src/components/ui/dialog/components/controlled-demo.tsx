import { useState } from 'react';

import { Dialog } from '..';

export const ControlledDialogDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
      >
        Controlled
      </button>
      <span className="text-xs text-gray-400">부모 상태 open = {String(open)}</span>

      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Overlay />
        <Dialog.Content>
          <div className="w-[340px]">
            <Dialog.Title>
              <span className="block text-lg font-bold text-gray-900">제어 Dialog</span>
            </Dialog.Title>
            <Dialog.Description>
              <span className="mt-2 block text-sm leading-relaxed text-gray-500">루퍼스 프론트엔드 1팀 화이팅</span>
            </Dialog.Description>
            <div className="mt-6 flex justify-end">
              <Dialog.Close>
                <span className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800">
                  닫기
                </span>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
};
