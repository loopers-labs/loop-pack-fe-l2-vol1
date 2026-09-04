"use client";

import { useEffect } from "react";

import { identify, reset } from "@/analytics/logger";
import { setAnalyticsUser } from "@/analytics/session";
import { useSession } from "@/entities/session/ui/SessionProvider";

// 로그인 상태를 계측에 잇는다. userId의 진실은 useSession(React state)이라 모듈 스코프 공통 프로퍼티가
// 직접 읽지 못하므로, 여기서 상태를 관측해 로거로 내려보낸다.
//
// 로그인 전이가 아니라 상태([user]) 변화에 반응하므로, 이벤트를 거치지 않는 경로(새로고침 재수화,
// 세션 만료로 user가 null이 되는 경로)에서도 userId가 실제 상태와 어긋나지 않는다.
export function AnalyticsSessionSync() {
  const { user } = useSession();

  useEffect(() => {
    if (user) {
      setAnalyticsUser(user.id);
      identify(user.id);
    } else {
      setAnalyticsUser(null);
      reset();
    }
  }, [user]);

  return null;
}
