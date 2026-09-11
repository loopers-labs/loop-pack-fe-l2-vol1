import Link from 'next/link'
import { requireSession } from '@/entities/session/server'
import { ROUTES } from '@/shared/config/routes'
import styles from './mypage.module.css'

/* 세션 조회 경계를 이 컴포넌트로 좁혀 Header와 h1이 함께 지연되지 않게 한다. */
export const MyProfile = async () => {
  const user = await requireSession(ROUTES.MYPAGE)

  return (
    <>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        <dl className={styles.profile}>
          <dt>이름</dt>
          <dd>{user.name}</dd>
          <dt>이메일</dt>
          <dd>{user.email}</dd>
        </dl>
      </div>
      <nav className={styles.links} aria-label="내 정보 바로가기">
        <Link href={ROUTES.ORDERS}>
          <span>주문 내역</span>
          <strong>바로가기</strong>
        </Link>
        <Link href={`${ROUTES.WISHLIST}?entryPoint=mypage_wishlist`}>
          <span>위시리스트</span>
          <strong>바로가기</strong>
        </Link>
      </nav>
    </>
  )
}
