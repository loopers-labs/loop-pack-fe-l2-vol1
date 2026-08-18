// 설정 누락은 데이터 실패와 성격이 다르다.
//
//   데이터 실패  — 재시도하면 될 수 있다. 부분 렌더로 넘어가는 게 사용자에게 이득이다.
//   설정 누락    — 재시도해도 같다. 삼키면 잘못된 배포가 조용히 살아 있는다.
//
// 화면은 이 둘을 같은 catch로 받고 있었다(generateMetadata의 `catch { return {} }`).
// 그래서 타입으로 갈라 설정 오류만 다시 던지게 한다.
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
