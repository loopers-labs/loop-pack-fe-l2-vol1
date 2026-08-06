import { Header } from '@/widgets/header';

export default function CommerceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="week05-page">
      <Header />
      {children}
    </main>
  );
}
