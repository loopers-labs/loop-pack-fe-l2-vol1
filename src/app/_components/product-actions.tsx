"use client";

import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import type { ReactNode } from "react";

interface ActionButtonProps {
  ariaLabel: string;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function ActionButton({
  ariaLabel,
  isActive,
  onToggle,
  children,
}: ActionButtonProps): React.JSX.Element {
  return (
    <button type="button" aria-label={ariaLabel} aria-pressed={isActive} onClick={onToggle}>
      {children}
    </button>
  );
}

interface ProductActionProps {
  productId: string;
  label: string;
}

export function WishlistButton({ productId, label }: ProductActionProps): React.JSX.Element {
  const isActive = useWishlistStore((state) => state.ids.has(productId));
  const toggle = useWishlistStore((state) => state.toggle);

  return (
    <ActionButton
      ariaLabel={`${label} 위시리스트`}
      isActive={isActive}
      onToggle={() => toggle(productId)}
    >
      {isActive ? "찜됨" : "찜"}
    </ActionButton>
  );
}

export function CartButton({ productId, label }: ProductActionProps): React.JSX.Element {
  const isActive = useCartStore((state) => state.ids.has(productId));
  const toggle = useCartStore((state) => state.toggle);

  return (
    <ActionButton
      ariaLabel={`${label} 장바구니`}
      isActive={isActive}
      onToggle={() => toggle(productId)}
    >
      {isActive ? "담김" : "담기"}
    </ActionButton>
  );
}
