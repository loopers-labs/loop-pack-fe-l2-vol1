import type { Metadata } from "next";
import { LoginPage } from "@/_pages/login/ui/LoginPage";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "로그인" };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = params.next;
  // 같은 키가 두 번 오면 배열이 된다. 그 경우는 조작으로 보고 버린다.
  return <LoginPage nextPath={typeof next === "string" ? next : null} />;
}
