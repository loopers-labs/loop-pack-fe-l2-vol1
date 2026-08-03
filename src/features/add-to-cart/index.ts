import { useCartStore } from "./model/store";

export { AddToCartButton } from "./ui/add-to-cart-button";

export const useCartCount = () => useCartStore((state) => state.cartIds.size);
