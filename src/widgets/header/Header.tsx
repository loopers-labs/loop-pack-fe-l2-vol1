'use client';

// [AI] 헤더. 위시리스트·장바구니 개수와 로그인 상태(이름 / 로그인 링크·로그아웃 버튼)를 표시한다.
// [임시] 로그인 상태는 클라이언트 me 조회(React Query)로 파악한다. 1-2에서 서버 컴포넌트가
// 쿠키를 읽어 초기 HTML에 반영하는 방식으로 업그레이드할 예정이다.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWishlistCount } from '@/features/toggle-wishlist/model/store';
import { useCartCount } from '@/features/add-to-cart/model/store';
import { logoutRequest } from '@/entities/auth/api';
import { meQueries } from '@/entities/auth/api/queries';
import styles from './Header.module.css';

export const Header = () => {
  const wishlistCount = useWishlistCount();
  const cartCount = useCartCount();
  const router = useRouter();
  const queryClient = useQueryClient();

  // [AI] me의 401은 실패가 아니라 "로그인 안 함"이라는 정상 답변이므로 (RFC 규칙),
  // isError여도 조용히 로그아웃 UI만 그린다 — 안내·리다이렉트는 보호 API 401의 몫이다.
  const { data } = useQuery(meQueries.me());
  const user = data?.user ?? null;

  const handleLogout = async () => {
    // 로그아웃(204): 서버가 쿠키 삭제 지시를 내리고 브라우저가 쿠키를 제거한다.
    await logoutRequest();
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
