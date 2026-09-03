// 과제가 제공하는 테스트 계정 8개(looper1@loopers.dev ~ looper8@loopers.dev,
// 비밀번호 전부 looper1234). 계정이 8개인 이유: 워커별로 계정을 하나씩
// 배정해 병렬 실행 시 워커끼리 서로의 주문·장바구니 데이터를 보지 않게 한다.
export const TEST_PASSWORD = 'looper1234';

// name은 src/app/api/_data/auth.ts의 accounts 생성 규칙(`루퍼${index+1}`)과
// 맞춰뒀다 — 초기 HTML에 로그인 상태(사용자 이름)가 반영되는지 확인할 때 씀.
export const accounts = Array.from({ length: 8 }, (_, index) => ({
  email: `looper${index + 1}@loopers.dev`,
  password: TEST_PASSWORD,
  name: `루퍼${index + 1}`,
}));
