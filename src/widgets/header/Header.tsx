'use client';

// [AI] 헤더. 위시리스트·장바구니 개수와 로그인 상태(이름 / 로그인 링크·로그아웃 버튼)를 표시한다.
// 로그인 상태의 진실은 서버(쿠키 판독)에 있다 (RFC 세션 소유 구조).
// - serverUser 제공(보호 경로): 서버가 초기 HTML에 이미 그려준 값 → me 조회를 건너뛴다 (1-2)
// - serverUser 미제공(공개 정적 페이지): 클라이언트 me 조회로 판단 (정적 생성 유지)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reset } from '@/analytics/logger';
import { useWishlistCount } from '@/features/toggle-wishlist/model/store';
import { useCartCount } from '@/features/add-to-cart/model/store';
import { logoutRequest } from '@/entities/auth/api';
import { meQueries } from '@/entities/auth/api/queries';
import type { AuthUser } from '@/entities/auth/model';
import styles from './Header.module.css';

type HeaderProps = {
  // [AI] 서버 컴포넌트가 쿠키를 판독해 내려주는 초기값. undefined = 서버 판독 없음(정적 페이지).
  serverUser?: AuthUser | null;
};

export const Header = ({ serverUser }: HeaderProps) => {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();
  const router = useRouter();
  const queryClient = useQueryClient();

  // [AI] serverUser가 있으면 초기 HTML이 이미 정답을 담고 있으므로 같은 질문(me)을 반복하지 않는다.
  const { data } = useQuery({ ...meQueries.me(), enabled: serverUser === undefined });
  const user = serverUser !== undefined ? serverUser : (data?.user ?? null);

  // [AI] me의 401은 실패가 아니라 "로그인 안 함"이라는 정상 답변이므로 (RFC 규칙),
  // isError여도 조용히 로그아웃 UI만 그린다 — 안내·리다이렉트는 보호 API 401의 몫이다.

  const handleLogout = async () => {
    // 로그아웃(204): 서버가 쿠키 삭제 지시를 내리고 브라우저가 쿠키를 제거한다.
    await logoutRequest();
    // [AI] 분석 사용자 연결 해제 (week-09 2-2): 로그아웃 이후 행동이 이전 사용자 것으로 기록되지 않게 한다.
    reset();
    // [AI] 상태 정리(RFC 방침): 세션 파생 캐시는 반드시 비우고, 카트·위시리스트는 유지한다.
    // 만료 처리기(1-4)와 같은 정리 절차를 쓰게 된다 — 1-4에서 공용 함수로 뽑아낸다.
    queryClient.clear();
    // 로그아웃 목적지 결정: 홈(/) — 공개 페이지라 가드에 다시 걸리지 않는다 (RFC).
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <Link href="/">Commerce</Link>
      <nav aria-label="주요 메뉴">
        <Link href="/products">상품</Link>
        {user ? (
          <>
            <span>{user.name}님</span>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <Link href="/login">로그인</Link>
        )}
        <span>위시리스트 {wishlistCount}</span>
        <span>장바구니 {cartCount}</span>
      </nav>
    </header>
  );
};
