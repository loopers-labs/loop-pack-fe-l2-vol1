import { Dialog } from '..';

/**
 * 비제어 컴포넌트 데모
 */
export const UncontrolledDialogDemo = () => {
  return (
    <Dialog>
      <Dialog.Trigger>
        <span className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-gray-300">
          Uncontrolled
        </span>
      </Dialog.Trigger>
      <Dialog.Overlay />
      <Dialog.Content>
        <div className="w-[340px]">
          <Dialog.Title>
            <span className="block text-lg font-bold text-gray-900">비제어 Dialog</span>
          </Dialog.Title>
          <Dialog.Description>
            <span className="mt-2 block text-sm leading-relaxed text-gray-500">루퍼스 4주차 화이팅</span>
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
  );
};
