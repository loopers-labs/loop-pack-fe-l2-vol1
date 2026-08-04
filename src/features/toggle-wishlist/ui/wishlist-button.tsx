"use client";

import { useWishlistStore } from "@/entities/wishlist";
import { ToggleButton } from "@/shared/ui/toggle-button";

interface WishlistButtonProps {
  productId: string;
  label: string;
}

export function WishlistButton({ productId, label }: WishlistButtonProps): React.JSX.Element {
  const isActive = useWishlistStore((state) => state.ids.has(productId));
  const toggle = useWishlistStore((state) => state.toggle);

  return (
    <ToggleButton
      ariaLabel={`${label} 위시리스트`}
      isActive={isActive}
      onToggle={() => toggle(productId)}
    >
      {isActive ? "찜됨" : "찜"}
    </ToggleButton>
  );
}
