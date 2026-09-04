import type { ReactNode } from "react";

import type { SessionUser } from "@/entities/session/model/types";
import { SessionProvider } from "@/entities/session/ui/SessionProvider";

// 테스트용 로그인 사용자. n으로 서로 다른 계정을 만든다.
// analytics는 id만, Header는 name도 검증하므로 세 필드를 n에 맞춰 채운다.
export function looperUser(n: number): SessionUser {
  return { id: `u${n}`, name: `루퍼${n}`, email: `looper${n}@loopers.dev` };
}

// SessionProvider로 감싼 트리를 돌려준다.
// 렌더 방식을 강제하지 않아 render·renderWithProviders·rerender 어디에나 합성된다.
export function withSession(user: SessionUser | null, ui: ReactNode) {
  return <SessionProvider user={user}>{ui}</SessionProvider>;
}
