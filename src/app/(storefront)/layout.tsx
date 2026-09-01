import { readServerSession, sessionUserOf } from '@/app/_session/currentUser'
import { Header } from '@/widgets/header'

// 세션을 읽는 범위다. 로그인 상태를 보여주는 화면만 이 그룹에 둔다.
// cookies()를 읽는 순간 이 그룹의 라우트는 요청마다 렌더된다. 홈과 목록은 7주차부터
// 이미 동적 렌더였으므로 이 결정으로 새로 잃는 정적 라우트는 없다.
export default async function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await readServerSession()

  const user = sessionUserOf(session)

  return (
    <>
      <Header session={user} />
      {children}
    </>
  )
}
