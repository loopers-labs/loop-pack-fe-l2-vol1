"use client";

import { useCartStore } from "@/entities/cart";
import { trackEvent } from "@/shared/analytics";
import { ToggleButton } from "@/shared/ui/toggle-button";

interface CartButtonProps {
  productId: string;
  label: string;
}

export function CartButton({ productId, label }: CartButtonProps): React.JSX.Element {
  const isActive = useCartStore((state) => state.ids.has(productId));
  const toggle = useCartStore((state) => state.toggle);

  // 담기만 계측한다. 해제는 시드 스키마에 없고 (cart_remove 없음), 집계 대상도 "담은 세션" 이다
  const handleToggle = () => {
    if (!isActive) {
      trackEvent("cart_add", { productId, quantity: 1 });
    }
    toggle(productId);
  };

  return (
    <ToggleButton ariaLabel={`${label} 장바구니`} isActive={isActive} onToggle={handleToggle}>
      {isActive ? "담김" : "담기"}
    </ToggleButton>
  );
}
