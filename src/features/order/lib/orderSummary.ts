import type { OrderItem } from '@/entities/order/model/types';
import {
  getProductPriceSummary,
  type ProductPriceSummary,
} from '@/entities/product/lib/productPricing';
import type { Product } from '@/entities/product/model/types';

export type OrderProductMap = ReadonlyMap<string, Product>;

export type OrderPriceSummary = ProductPriceSummary;

export function getOrderItemCount(items: readonly OrderItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getOrderTotal(
  items: readonly OrderItem[],
  products: OrderProductMap,
): number {
  return getOrderPriceSummary(items, products).paymentTotal;
}

export function getOrderPriceSummary(
  items: readonly OrderItem[],
  products: OrderProductMap,
): OrderPriceSummary {
  return getProductPriceSummary(items, products);
}

export function formatOrderDate(createdAt: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}
