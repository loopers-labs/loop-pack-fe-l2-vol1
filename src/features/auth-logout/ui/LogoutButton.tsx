'use client';

import { useLogout } from '@/features/auth-logout/model/useLogout';

export function LogoutButton() {
  const { handleLogout, isPending, errorMessage } = useLogout();

  return (
    <>
      <button type="button" onClick={() => handleLogout()} disabled={isPending}>
        {isPending ? '로그아웃 중...' : '로그아웃'}
      </button>
      {errorMessage && (
        <p className="week05-error" role="alert">
          {errorMessage}
        </p>
      )}
    </>
  );
}
