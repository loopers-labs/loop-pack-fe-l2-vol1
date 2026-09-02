// [AI] Auth 도메인 타입의 소유자(entities/auth). 서버 전용 파일(_data/auth.ts, node:crypto 사용)과
// 달리 클라이언트에서 안전하게 import할 수 있다 (entities/order/model과 같은 패턴).
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: AuthUser;
};
