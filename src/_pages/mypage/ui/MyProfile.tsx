import { cookies } from 'next/headers'
import Link from 'next/link'
import { getSession } from '@/entities/session'
import styles from './mypage.module.css'

// 세션을 읽는 async 경계를 이 컴포넌트로 좁힌다. 페이지를 async로 만들면 return 전체가
// await 뒤로 밀려 Header와 h1까지 세션을 기다린다(HomePage.tsx에 같은 실수가 기록되어 있다).
export const MyProfile = async () => {
  // 서버 fetch는 브라우저 쿠키를 자동으로 붙이지 않는다. entities/session은 클라이언트에서도
  // 쓰이는 모듈이라 next/headers를 품지 않으므로, 쿠키를 읽는 일은 서버 호출자가 한다.
  // cookies()를 부르면 이 라우트가 동적이 된다.
  const cookieHeader = (await cookies()).toString()
  const user = await getSession(cookieHeader)

  // proxy.ts 가드가 앞에서 막으므로 미로그인은 여기까지 오지 않는다. 이 분기는 위조·만료 쿠키가
  // 가드를 통과한 경우에만 걸린다(decisions.md 10번) — 그때 화면이 비지 않게 남겨 둔다.
  if (user === null) {
    return <p>로그인이 필요한 화면입니다.</p>
  }

  return (
    <>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        {/* GET /api/auth/me가 주는 것이 전부다. 그 외 필드는 API에 없다. */}
        <dl className={styles.profile}>
          <dt>이름</dt>
          <dd>{user.name}</dd>
          <dt>이메일</dt>
          <dd>{user.email}</dd>
        </dl>
      </div>
      {/*
        이 화면은 요약만 하고 목록은 각 화면이 소유한다.
        로그아웃 버튼을 두지 않는 것은 헤더가 이 화면에도 떠 있어 진입점이 이미 있기 때문이다.
        두 곳에 두면 같은 이름의 요소가 둘이라 role+name 셀렉터가 Playwright strict mode에 걸린다.
      */}
      <nav className={styles.links} aria-label="내 정보 바로가기">
        <Link href="/orders">
          <span>주문 내역</span>
          <strong>바로가기</strong>
        </Link>
        <Link href="/wishlist?entryPoint=mypage_wishlist">
          <span>위시리스트</span>
          <strong>바로가기</strong>
        </Link>
      </nav>
    </>
  )
}
