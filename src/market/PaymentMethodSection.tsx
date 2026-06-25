import type { PaymentMethod } from "./types";
import { Section } from "./Section";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "신용/체크카드",
  transfer: "계좌이체",
  kakao: "카카오페이",
};

const PAYMENT_METHODS: PaymentMethod[] = ["card", "transfer", "kakao"];

type PaymentMethodSectionProps = {
  selectedPaymentMethod: PaymentMethod;
  onPaymentMethodChange: (payment: PaymentMethod) => void;
};

export function PaymentMethodSection({
  selectedPaymentMethod,
  onPaymentMethodChange,
}: PaymentMethodSectionProps) {
  return (
    <Section title="결제수단">
      {PAYMENT_METHODS.map((m) => (
        <label key={m}>
          <input
            type="radio"
            checked={selectedPaymentMethod === m}
            onChange={() => onPaymentMethodChange(m)}
          />
          {PAYMENT_METHOD_LABELS[m]}
        </label>
      ))}
    </Section>
  );
}
