import { CommerceProviders } from "@/_app";

export default function CommerceLayout({ children }: { children: React.ReactNode }) {
  return <CommerceProviders>{children}</CommerceProviders>;
}
