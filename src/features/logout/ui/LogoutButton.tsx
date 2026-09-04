'use client'

import { useLogout } from '@/features/logout/model/useLogout'

// 확인 창을 두지 않는다. 되돌리는 비용이 다시 로그인하는 것뿐이고,
// 소유자별로 목록을 나눠 들기 때문에 로그아웃해도 잃는 데이터가 없다(decisions.md 3번).
export const LogoutButton = () => {
  const { logout, isPending, error } = useLogout()

  return (
    <>
      <button type="button" onClick={() => logout()} disabled={isPending}>
        로그아웃
      </button>
      {error !== null && <span role="alert">{error.message}</span>}
    </>
  )
}
