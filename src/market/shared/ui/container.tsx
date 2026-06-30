// 공통 컴포넌트 구현(SectionContainer, CheckoutContainer)
interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

export const SectionContainer = ({ title, children }: SectionProps) => {
  return (
    <div className="section">
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
};

export const CheckoutContainer = ({ title, children }: SectionProps) => {
  return (
    <div className="checkout">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  );
};
