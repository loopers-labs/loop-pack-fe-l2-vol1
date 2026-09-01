import { Header } from '@/widgets/header'

// 데모 라우트 그룹이다. 세션을 읽지 않으므로 정적 생성 대상으로 남는다.
// Header 에 session 을 넘기지 않으면 인증 영역 자체가 그려지지 않는다.
// 로그인 여부를 모르는 화면이 "로그인하세요"라고 말하면, 로그인한 사용자에게
// 거짓을 보여주게 된다.
export default function LabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
