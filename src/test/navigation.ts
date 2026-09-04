import { vi } from "vitest";

// setup.ts의 next/navigation 전역 목이 돌려주는 실체.
// 호출을 검증하는 테스트는 useRouter()를 최상위에서 부르는 대신(rules-of-hooks 위반) 이 객체를 직접 집는다.
// 컴포넌트가 실제로 부르는 것만 둔다(push·replace·refresh). 새 메서드를 쓰면 여기 추가한다.
export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

export const redirectMock = vi.fn();
