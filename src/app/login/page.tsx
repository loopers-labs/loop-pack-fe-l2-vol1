import { Suspense } from "react";
import { CommerceHeader } from "@/widgets/commerce";
import { LoginSection } from "@/_pages/login";
import app from "@/_app/styles/app.module.css";

export default function LoginPage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      {/* LoginForm 이 useSearchParams(redirectUrl)를 읽어 CSR bailout 이 생기므로 Suspense 로 격리한다.
          https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout */}
      <Suspense fallback={null}>
        <LoginSection />
      </Suspense>
    </main>
  );
}
