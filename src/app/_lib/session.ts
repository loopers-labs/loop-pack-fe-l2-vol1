import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSessionToken } from '@/app/api/_data/auth';
import {
  SCENARIO_COOKIE,
  SESSION_COOKIE,
} from '@/app/api/_data/auth-cookies';
import { createLoginHref } from '@/features/auth/lib/authNavigation';
import type { AuthUser } from '@/entities/auth/model/types';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  if (cookieStore.get(SCENARIO_COOKIE)?.value === 'expired') {
    return null;
  }

  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireCurrentUser(
  returnTo: string,
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(createLoginHref(returnTo));
  }

  return user;
}
