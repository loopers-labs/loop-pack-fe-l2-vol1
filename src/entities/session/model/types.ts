// 클라에 노출하는 로그인 사용자. 서버(app)의 AuthUser와 같은 모양이지만,
// entities는 app을 import하지 않으므로 여기서 따로 정의한다(crypto가 entities로 새지 않게).
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};
