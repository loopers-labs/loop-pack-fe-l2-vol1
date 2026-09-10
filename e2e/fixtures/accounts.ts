import type { AuthUser } from "../../src/types/auth";

// 테스트가 소유하는 계정 목록. mock 백엔드(src/app/api/_data/auth.ts)의 값을 import 하지 않고 복제한다 —
// 구현이 바뀌면 E2E 가 조용히 따라가는 대신 로그인 실패로 드러나야 한다 (week09 RFC C.4)
export const TEST_PASSWORD = "looper1234";

export const testAccounts: AuthUser[] = Array.from({ length: 8 }, (_, index) => ({
  id: `u${index + 1}`,
  name: `루퍼${index + 1}`,
  email: `looper${index + 1}@loopers.dev`,
}));
