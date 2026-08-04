"use client";

import { useCartStore } from "@/entities/cart";
import { ToggleButton } from "@/shared/ui/toggle-button";

interface CartButtonProps {
  productId: string;
  label: string;
}

export function CartButton({ productId, label }: CartButtonProps): React.JSX.Element {
  const isActive = useCartStore((state) => state.ids.has(productId));
  const toggle = useCartStore((state) => state.toggle);

  return (
    <ToggleButton
      ariaLabel={`${label} 장바구니`}
      isActive={isActive}
      onToggle={() => toggle(productId)}
    >
      {isActive ? "담김" : "담기"}
    </ToggleButton>
  );
}
