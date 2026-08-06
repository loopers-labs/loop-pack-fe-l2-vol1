import { CommerceHeader } from "@/widgets/header";

export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 pb-16 sm:px-6 lg:px-8">
      <CommerceHeader />
      <main>{children}</main>
    </div>
  );
}
