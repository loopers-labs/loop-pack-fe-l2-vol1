import type { Address } from '@/market/types';

interface AddressFieldProps {
  address: Address;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * 배송지 1건의 표시 · 선택 라디오.
 *
 * - 원인: CheckoutPage 파일 안에 컴포넌트 단위로 존재 → 단일 컴포넌트 파일로 분리하여 유지보수성을 확보
 */
export function AddressField({ address, selected, onSelect }: AddressFieldProps) {
  return (
    <label className="addr">
      <input type="radio" checked={selected} onChange={() => onSelect(address.id)} />
      <span>
        {address.label} · {address.recipient} ({address.detail}){address.isRemote ? ' · 도서산간' : ''}
      </span>
    </label>
  );
}
