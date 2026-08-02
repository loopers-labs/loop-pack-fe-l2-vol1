import { Suspense } from "react";
import { CommerceHeader } from "@/widgets/commerce";
import { HomeSection } from "@/_pages/home";
import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

export default function HomePage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      <Suspense
        fallback={<p className={layout.status}>홈 데이터를 불러오는 중…</p>}
      >
        <HomeSection />
      </Suspense>
    </main>
  );
}
