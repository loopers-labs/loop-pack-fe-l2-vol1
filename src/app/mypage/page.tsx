import type { Metadata } from "next";
import { MyPage } from "@/_pages/mypage";
import { requireServerSession } from "@/app/_lib/session";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false },
};

export default async function MyPageRoute() {
  const user = await requireServerSession("/mypage");

  return <MyPage user={user} />;
}
