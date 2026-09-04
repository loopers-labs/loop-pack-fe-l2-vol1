// 보호 자원의 401을 "세션 만료"로 번역한 표시. proxy.ts가 진입을 이미 막으므로
// 보호 화면 안에서 받는 401은 이 타입으로만 전역 처리(providers.tsx)에 오른다.
export class SessionExpiredError extends Error {
  constructor() {
    super('세션이 만료되었습니다.');
    this.name = 'SessionExpiredError';
  }
}
