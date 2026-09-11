import { cookies } from 'next/headers'
import { getSession } from '@/entities/session'
import { HeaderNav } from '@/widgets/header/HeaderNav'

/*
  서버 세션을 읽어 초기 HTML에 로그인 상태를 반영한다.
  그 대가로 헤더를 사용하는 라우트의 서버 렌더가 세션 조회만큼 지연된다.
  entities/session은 클라이언트에서도 사용하므로 cookies()는 서버 호출자인 이 컴포넌트가 읽는다.
*/
export const Header = async () => {
  const cookieHeader = (await cookies()).toString()
  const user = await getSession(cookieHeader)

  return <HeaderNav user={user} />
}
