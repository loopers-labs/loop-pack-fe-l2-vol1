import { PAYMENT_LABEL } from './types';
import type { PaymentMethod } from './types';

type PaymentMethodOptionProps = {
  method: PaymentMethod;
  checked: boolean;
  onSelect: (method: PaymentMethod) => void;
};

export function PaymentMethodOption({
  method,
  checked,
  onSelect,
}: PaymentMethodOptionProps) {
  return (
    <label>
      <input type="radio" checked={checked} onChange={() => onSelect(method)} />
      {PAYMENT_LABEL[method]}
    </label>
  );
}
