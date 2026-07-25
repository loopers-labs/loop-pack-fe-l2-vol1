import { CommerceProviders } from "@/commerce";

export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return <CommerceProviders>{children}</CommerceProviders>;
}
