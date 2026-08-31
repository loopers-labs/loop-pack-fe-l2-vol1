import type { OrderItem } from '@/entities/order/model/types';
import type { Product } from '@/entities/product/model/types';

export type OrderProductMap = ReadonlyMap<string, Product>;

export function getOrderItemCount(items: readonly OrderItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getOrderTotal(
  items: readonly OrderItem[],
  products: OrderProductMap,
): number {
  return items.reduce((total, item) => {
    const product = products.get(item.productId);
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);
}

export function formatOrderDate(createdAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}
