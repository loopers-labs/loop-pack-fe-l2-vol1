"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCartCount } from "@/entities/cart";
import { sessionQueryOptions } from "@/entities/session";
import { useWishlistCount } from "@/entities/wishlist";
import { useLogout } from "@/features/auth";

// ── 세 갈래를 세 가지로 그린다 ──────────────────────────────────────────────
// 예전엔 두 갈래였다 — authenticated면 계정 이름, 아니면 로그인 링크. 그런데
// `session === undefined`("아직 아무도 판정하지 않았다")가 미로그인과 같은 모양으로
// 그려졌고, 그 겹침이 두 곳에서 비용을 만들었다.
//
//   ① 사용자: 서버 주입이 빠지면 로그인해 둔 계정이 한순간 미로그인으로 보인다.
//   ② 테스트: `로그인 계정 …` 라벨 하나에 "로그인됨"과 "서버가 그렸음"이 겹쳐서,
//      라벨을 못 찾았을 때 서버 렌더가 빠진 것인지 로그인이 안 된 것인지
//      실패 메시지가 가르지 못했다(5단계 E6에서 절반만 짚인 자리다).
//
// (shop) layout이 쿠키를 읽어 심어 주므로 커머스 화면에서는 이 자리가 나오지 않는다.
// 나오면 그 자체가 신호다.
//
// 로그아웃 mutation을 여기로 내렸다 — 그 버튼을 그리는 자리와 같은 곳이다.
function AccountNav() {
  const { data: session } = useQuery(sessionQueryOptions());
  const logout = useLogout();

  if (session === undefined) {
    return <span>계정 확인 중…</span>;
  }

  if (session.status !== "authenticated") {
    return <Link href="/login">로그인</Link>;
  }

  return (
    <>
      <Link href="/orders">주문 내역</Link>
      <span aria-label={`로그인 계정 ${session.user.name}`}>{session.user.name}</span>
      <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
        로그아웃
      </button>
    </>
  );
}

// 헤더는 "개수"만 구독한다 — 어떤 상품이 담겼는지는 알 필요가 없다.
// 두 entity를 조합해 보여주는 독립 블록이라 widget이다.
export function Header() {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();

  return (
    <header className="shop-header">
      <Link href="/" className="shop-logo">
        Commerce
      </Link>
      <nav className="shop-nav" aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        <span aria-label={`위시리스트 ${wishlistCount}개`}>위시리스트 {wishlistCount}</span>
        <span aria-label={`장바구니 ${cartCount}개`}>장바구니 {cartCount}</span>
        {/* (shop) layout이 서버에서 넣어둔 세션을 읽는다. 그래서 초기 HTML에도
            로그인 상태가 들어 있고, JS가 실행되기 전에 보인다. */}
        <AccountNav />
      </nav>
    </header>
  );
}
