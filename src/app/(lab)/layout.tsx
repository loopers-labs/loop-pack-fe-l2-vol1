import { SiteHeader } from "@/widgets/header";

// 로그인 상태와 무관한 데모 화면(/select · /dialog · /performance-lab). 세션을 읽지 않으므로 정적으로 미리 만들어진다
export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="week05-page">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
