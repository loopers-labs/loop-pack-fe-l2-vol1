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

  return (
    <button
      {...props}
      className={['week05-button', className].filter(Boolean).join(' ')}
      type="button"
      onClick={() => logout.mutate()}
      disabled={disabled || logout.isPending}
    >
      {logout.isPending ? '로그아웃 중…' : '로그아웃'}
    </button>
  );
}
