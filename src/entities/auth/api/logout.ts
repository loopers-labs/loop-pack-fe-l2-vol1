import { ApiError } from '@/shared/api/apiFetch';

// 스펙상 logout은 노브 없이 항상 204를 반환한다(과제 57번 줄) — apiFetch의 JSON 파싱
// 계약과 안 맞아 여기서 fetch를 직접 쓴다.
export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });

  if (!res.ok) {
    throw new ApiError(res.status, '로그아웃하지 못했습니다.');
  }
}
