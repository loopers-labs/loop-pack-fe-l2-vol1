import type { Metadata } from "next";
import { LoginPage } from "@/_pages/login";

export const metadata: Metadata = {
  title: "로그인",
  description: "Commerce 계정으로 로그인합니다.",
};

export default function Page() {
  return <LoginPage />;
}
