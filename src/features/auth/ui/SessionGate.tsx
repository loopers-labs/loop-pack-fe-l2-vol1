"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { sessionQueryOptions } from "@/entities/session";

// ── 보호 화면은 만료를 각자 읽지 않는다 ─────────────────────────────────────
// 예전에는 주문 내역만 만료를 그렸다. 주문서는 세션을 아예 안 봐서, 만료된
// 사용자가 정상 주문서를 보고 **주문하기를 누른 뒤에야** 만료를 알았다.
//
// 화면마다 처리하면 다음에 어디를 고칠지 알 수 없다 — 세션 만료 처리 자리를
// 한 곳으로 정한다는 결정을 판정(resolveSession)뿐 아니라 **표시**에도 적용한다.
// 보호 화면은 이 문을 지난다.
export function SessionGate({ children }: { children: ReactNode }) {
  const { data: session } = useQuery(sessionQueryOptions());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (session?.status !== "expired") {
    return children;
  }

  // 돌아올 자리를 그대로 실어 보낸다. 만료로 쫓겨난 사람이 로그인한 뒤
  // 홈으로 떨어지면, 하려던 일을 처음부터 다시 찾아야 한다.
  const query = searchParams.toString();
  const next = query === "" ? pathname : `${pathname}?${query}`;

  return (
    <main className="shop-page">
      <div className="shop-state" role="alert">
        <p>세션이 만료되었습니다. 다시 로그인해 주세요.</p>
        <Link href={`/login?next=${encodeURIComponent(next)}`}>로그인</Link>
      </div>
    </main>
  );
}
