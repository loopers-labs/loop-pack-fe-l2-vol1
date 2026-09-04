// 인증 응답 계약. mock 백엔드(app/api/_data/auth.ts)와 같은 모양이지만,
// src는 app을 import하지 않으므로(FSD 경계) 소비하는 쪽에 다시 선언한다.
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionResponse = {
  user: AuthUser;
};
