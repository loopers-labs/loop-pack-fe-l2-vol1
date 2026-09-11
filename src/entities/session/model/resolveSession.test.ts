import { describe, expect, it } from "vitest";
import {
  ANONYMOUS,
  EXPIRED,
  acceptSession,
  rejectSession,
  sessionFromCookie,
} from "./resolveSession";
import type { SessionState, SessionUser } from "./types";

const USER: SessionUser = { id: "u1", name: "루퍼1", email: "looper1@loopers.dev" };
const AUTHENTICATED: SessionState = { status: "authenticated", user: USER };

// 서버가 세션을 거절했을 때 "만료"와 "로그인 안 함"을 가르는 규칙.
// /api/auth/me는 둘을 같은 401로 돌려주므로 응답만으로는 알 수 없고,
// 이 브라우저가 로그인했다고 믿는 근거가 있었는지로 가른다.
describe("rejectSession — 거절을 만료와 미로그인으로 가른다", () => {
  it("직전이 authenticated면 만료다", () => {
    expect(rejectSession(AUTHENTICATED)).toEqual(EXPIRED);
  });

  // 이 케이스가 이 함수를 만든 이유다. 예전에는 세션 조회가 401을 무조건
  // anonymous로 접어서, 재조회 한 번에 만료 표시가 소리 없이 사라졌다.
  it("이미 만료면 다시 물어봐도 만료로 남는다", () => {
    expect(rejectSession(EXPIRED)).toEqual(EXPIRED);
  });

  it("직전이 anonymous면 anonymous다", () => {
    expect(rejectSession(ANONYMOUS)).toEqual(ANONYMOUS);
  });

  it("직전을 모르면 anonymous다 — 만료로 단정할 근거가 없다", () => {
    expect(rejectSession(undefined)).toEqual(ANONYMOUS);
  });
});

// 서버 전용 진입점. 근거가 다르다 — 서버는 httpOnly 쿠키를 직접 볼 수 있다.
describe("sessionFromCookie — 서버는 쿠키를 근거로 쓴다", () => {
  it("서버가 인정한 사용자는 authenticated다", () => {
    expect(sessionFromCookie(true, USER)).toEqual(AUTHENTICATED);
    // 쿠키 유무와 무관하게 사용자가 있으면 인정된 것이다.
    expect(sessionFromCookie(false, USER)).toEqual(AUTHENTICATED);
  });

  it("쿠키를 들고 왔는데 인정받지 못하면 만료다", () => {
    expect(sessionFromCookie(true, null)).toEqual(EXPIRED);
  });

  it("쿠키도 없으면 anonymous다", () => {
    expect(sessionFromCookie(false, null)).toEqual(ANONYMOUS);
  });
});

describe("acceptSession", () => {
  it("사용자를 authenticated 상태에 담는다", () => {
    expect(acceptSession(USER)).toEqual(AUTHENTICATED);
  });
});
