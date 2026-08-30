'use client';

import Link from 'next/link';

import { LOGIN_PATH } from '../model/login-url';

import { LogoutButton } from './LogoutButton';

import { useSessionUser } from '@/entities/session';

export function SessionMenu() {
  const user = useSessionUser();

  if (!user) return <Link href={LOGIN_PATH}>로그인</Link>;

  return (
    <>
      <span>{user.name}</span>
      <LogoutButton />
    </>
  );
}
