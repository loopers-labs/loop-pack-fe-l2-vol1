// [AI] auth API 호출 모음. 로그인은 mutation 성격이라 queryOptions 없이 함수로 둔다
// (로그아웃·me는 1-2에서 같은 모듈에 추가한다).
import { apiFetch, apiFetchEmpty } from '@/shared/api/fetcher';
import type { LoginRequest, SessionResponse } from '@/entities/auth/model';

// 성공(200) 시 브라우저가 Set-Cookie로 세션 쿠키를 저장한다.
// 실패(400 형식 오류 / 401 자격 증명 불일치)는 ApiError(status)로 던져진다.
export const loginRequest = (body: LoginRequest) =>
  apiFetch<SessionResponse>('/api/auth/login', { method: 'POST', body });

// 로그아웃(204): 본문 없음, 쿠키 삭제 지시가 응답의 전부다. 시나리오 노브 없이 항상 204를 돌려준다.
export const logoutRequest = () => apiFetchEmpty('/api/auth/logout', { method: 'POST' });
