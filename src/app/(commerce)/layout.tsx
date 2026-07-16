import { CommerceHeader } from "@/components/commerce/CommerceHeader";

export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <CommerceHeader />
      <main>{children}</main>
    </div>
  );
}
