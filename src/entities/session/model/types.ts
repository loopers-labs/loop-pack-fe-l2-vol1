// 서버와 클라이언트가 공유하는 인증 응답 계약.
// mock 백엔드(app/api/_data/auth.ts)도 이 타입을 지킨다 — entities/product와 같은 방향이다.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionResponse = {
  user: SessionUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

// 세 상태는 동시에 참이 될 수 없다. boolean 두 개(`isLoggedIn`·`isExpired`)로 두면
// "로그인했는데 만료됨" 같은 표현 불가능한 조합이 타입에 남는다.
//
//   anonymous     — 로그인한 적이 없다(또는 브라우저가 세션을 모른다)
//   authenticated — 서버가 이 요청의 세션을 인정했다
//   expired       — 인정했던 세션이 보호된 요청에서 거절됐다
//
// anonymous와 expired를 가르는 이유는 화면이 할 말이 다르기 때문이다. 전자는
// "로그인하세요"고 후자는 "다시 로그인하세요"다. /api/auth/me는 둘을 같은 401로
// 돌려주므로, 이 구분은 응답이 아니라 **전이**에서 나온다(sessionExpiry.ts).
export type SessionState =
  { status: "anonymous" } | { status: "authenticated"; user: SessionUser } | { status: "expired" };
