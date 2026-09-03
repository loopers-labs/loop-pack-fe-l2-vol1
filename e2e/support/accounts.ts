// 과제가 제공하는 테스트 계정 8개(looper1@loopers.dev ~ looper8@loopers.dev,
// 비밀번호 전부 looper1234). 계정이 8개인 이유: 워커별로 계정을 하나씩
// 배정해 병렬 실행 시 워커끼리 서로의 주문·장바구니 데이터를 보지 않게 한다.
export const TEST_PASSWORD = 'looper1234';

export const accounts = Array.from({ length: 8 }, (_, index) => ({
  email: `looper${index + 1}@loopers.dev`,
  password: TEST_PASSWORD,
}));
