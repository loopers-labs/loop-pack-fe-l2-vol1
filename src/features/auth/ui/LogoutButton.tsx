'use client';

import { useLogout } from '../model/useLogout';

/**
 * 로그아웃 버튼.
 *
 * 세션 무효화와 계측은 useLogout 이 갖는다. 이 파일은 무엇을 보여줄지만 정한다.
 */
export function LogoutButton() {
  const logout = useLogout();

  return (
    <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
      로그아웃
    </button>
  );
}
