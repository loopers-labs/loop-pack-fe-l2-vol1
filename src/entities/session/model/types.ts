// 인증 API의 사용자 응답 계약. 서버 라우트(src/app/api)도 여기서 가져다 써 정의를 한 벌로 유지한다.
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};
