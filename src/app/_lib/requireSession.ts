import { redirect } from 'next/navigation';
import { buildLoginPath } from '@/shared/lib/safeRedirectPath';
import { readServerSession } from '@/app/_lib/readServerSession';
import type { ServerSession } from '@/entities/session/model/session';

/**
 * 보호 화면의 서버 쪽 인증 경계.
 *
 * proxy는 쿠키 존재만 보므로 위조되거나 만료된 쿠키를 그대로 통과시킨다. 서명과 만료를
 * 실제로 확인할 수 있는 건 여기다. 두 겹을 두는 게 아니라, 각 겹이 볼 수 있는 것이 다르다.
 *
 * @param currentPath 로그인 후 돌아올 경로
 */
export async function requireSession(currentPath: string): Promise<ServerSession> {
  const session = await readServerSession();

  if (session.status !== 'authenticated') {
    redirect(buildLoginPath(currentPath, session.status === 'expired'));
  }

  return session;
}
