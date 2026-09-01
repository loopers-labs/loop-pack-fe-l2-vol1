// 세션 사용자의 형태만 선언한다. 서버 응답 타입(app/api/_data/auth)을 참조하면
// entities가 app을 import하는 역방향 의존이 된다.
export interface SessionUser {
  id: string
  name: string
  email: string
}

// null은 미로그인, undefined는 그 화면이 세션을 읽지 않았다는 뜻이다.
// 둘을 구분해야 세션을 모르는 화면이 로그인 여부를 표시하지 않는다.
export type SessionState = SessionUser | null | undefined
