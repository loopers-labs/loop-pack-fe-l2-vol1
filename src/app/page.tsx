import { SiteHeader } from "@/components/commerce/SiteHeader";
import { HomePageClient } from "@/features/home/HomePageClient";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-16">
      <SiteHeader wishlistCount={0} cartCount={0} />
      <HomePageClient />
    </main>
  );
}
