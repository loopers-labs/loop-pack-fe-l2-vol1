import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPage } from "@/_pages/login";
import { getServerSession } from "@/app/_lib/session";
import {
  isLoginReason,
  LOGIN_REASON_PARAM,
  RETURN_TO_PARAM,
  sanitizeReturnTo,
} from "@/shared/lib/return-to";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false },
};

type LoginRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(firstValue(params[RETURN_TO_PARAM]));
  const reasonValue = firstValue(params[LOGIN_REASON_PARAM]);
  const reason = isLoginReason(reasonValue) ? reasonValue : undefined;

  // 이미 로그인한 사람은 바로 원래 경로로. 단 만료 안내로 들어온 요청은 쿠키가 남아 있어도
  // 폼을 보여준다 — 그렇지 않으면 "보호 페이지 401 → 로그인 → 보호 페이지" 가 돈다
  if (reason === undefined && (await getServerSession()) !== null) {
    redirect(returnTo);
  }

  return <LoginPage returnTo={returnTo} reason={reason} />;
}
