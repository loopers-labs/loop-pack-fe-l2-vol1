import { CommerceHeader } from "@/widgets/commerce";
import { MyPageSection } from "@/_pages/mypage";
import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

export default function MyPage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      <section className={layout.section}>
        <h1 className={layout.sectionTitle}>마이페이지</h1>
        <MyPageSection />
      </section>
    </main>
  );
}
