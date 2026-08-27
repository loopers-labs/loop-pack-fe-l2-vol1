import { CommerceHeader } from "@/widgets/commerce";
import { NewOrderSection } from "@/_pages/orders";
import app from "@/_app/styles/app.module.css";
import layout from "@/shared/ui/layout.module.css";

export default function NewOrderPage() {
  return (
    <main className={app.page}>
      <CommerceHeader />
      <section className={layout.section}>
        <h1 className={layout.sectionTitle}>주문서</h1>
        <NewOrderSection />
      </section>
    </main>
  );
}
