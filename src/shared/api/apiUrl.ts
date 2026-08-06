// URL 조립은 여기 한 곳에서만 한다. 조립이 흩어지면 같은 조건에 다른 요청이 나간다.
// 브라우저는 상대 경로를 쓰고, 자기 주소를 모르는 서버만 origin을 받는다.
// origin은 전송 위치일 뿐 응답 의미를 바꾸지 않아 query key에는 넣지 않는다.
export const apiUrl = (path: string, origin?: string) =>
  origin ? new URL(path, origin).toString() : path
