import type { Address } from '../types';

type Props = {
  address: Address;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function AddressField({ address, selected, onSelect }: Props) {
  return (
    <label className="addr">
      <input
        type="radio"
        checked={selected}
        onChange={() => onSelect(address.id)}
      />
      <span>
        <strong>{address.label}</strong> · {address.recipient} ({address.detail}
        )
        {address.isRemote ? (
          <span className="addr-remote"> · 도서산간</span>
        ) : (
          ''
        )}
      </span>
    </label>
  );
}
