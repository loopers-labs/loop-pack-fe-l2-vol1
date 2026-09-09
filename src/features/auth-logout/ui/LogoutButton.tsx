'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useLogoutMutation } from '../api/useLogoutMutation';

type LogoutButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'>;

/**
 * 로그아웃 버튼. HTML button 속성을 그대로 확장한다.
 *
 * @param props disabled를 제외한 나머지는 button에 그대로 전달된다. 클릭 동작은 이 컴포넌트가
 *   소유하므로 onClick과 type은 받지 않는다
 */
export function LogoutButton({ disabled, className, ...props }: LogoutButtonProps) {
  const logout = useLogoutMutation();

  // 실패해도 세션과 담은 목록을 그대로 두는 것이 정책이라(useLogoutMutation), 사용자는
  // 화면이 안 바뀐 이유를 알 수 없다. 그 이유를 버튼 옆에 남긴다.
  // Header의 nav는 인라인 항목이 줄지어 있어 p 대신 span으로 흐름을 유지한다
  const failureMessage = logout.isError && !logout.isPending ? logout.error.message : null;

  return (
    <>
      <button
        {...props}
        className={['week05-button', className].filter(Boolean).join(' ')}
        type="button"
        onClick={() => logout.mutate()}
        disabled={disabled || logout.isPending}
      >
        {logout.isPending ? '로그아웃 중…' : '로그아웃'}
      </button>
      {failureMessage === null ? null : <span role="alert">{failureMessage}</span>}
    </>
  );
}
