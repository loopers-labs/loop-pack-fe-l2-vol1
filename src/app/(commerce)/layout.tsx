import { getServerSession } from "@/app/_lib/session";
import { SessionBoundary } from "@/features/auth";
import { HeaderAuth, SiteHeader } from "@/widgets/header";

// 세션을 읽는 유일한 layout. cookies() 를 읽는 순간 그 아래 화면은 요청 시 렌더가 되므로,
// 로그인 상태를 헤더에 보여 줘야 하는 커머스 화면만 이 그룹에 둔다. (lab) 그룹의 데모 화면은 정적으로 남는다
export default async function CommerceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSession();

  return (
    <>
      <SessionBoundary />
      <div className="week05-page">
        <SiteHeader auth={<HeaderAuth initialUser={user} />} />
        <main>{children}</main>
      </div>
    </>
  );
}
