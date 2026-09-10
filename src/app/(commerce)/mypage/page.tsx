import type { Metadata } from "next";
import { MyPage } from "@/_pages/mypage";
import { requireServerSession } from "@/app/_lib/session";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false },
};

type MyPageRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyPageRoute({ searchParams }: MyPageRouteProps) {
  const user = await requireServerSession("/mypage", await searchParams);

  return <MyPage user={user} />;
}
