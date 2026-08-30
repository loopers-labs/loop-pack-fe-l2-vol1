'use client';

import Link from 'next/link';

import { buildLoginUrl } from '../model/login-url';

import { Dialog } from '@/shared/ui/dialog/Dialog';

const TITLE_ID = 'login-required-title';

export function LoginRequiredDialog({
  open,
  onOpenChange,
  redirectPathAfterLogin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPathAfterLogin: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="fixed top-1/2 left-1/2 z-50 w-100 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
      >
        <Dialog.Title id={TITLE_ID} className="text-lg font-bold">
          로그인 필요
        </Dialog.Title>
        <Dialog.Description className="mt-1.5 text-sm text-[#5a6675]">
          로그인 페이지로 이동하시겠습니까?
        </Dialog.Description>
        <div className="week05-error-actions mt-5 justify-end">
          <Dialog.Close>닫기</Dialog.Close>
          <Link href={buildLoginUrl(redirectPathAfterLogin)}>이동</Link>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
