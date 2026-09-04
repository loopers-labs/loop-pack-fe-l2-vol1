import Link from 'next/link';
import Image from 'next/image';
import type { OrderItem } from '@/entities/order/model/types';
import { ProductLinePrice } from '@/entities/product/ui/ProductLinePrice';
import type { OrderProductMap } from '@/features/order/lib/orderSummary';

interface OrderProductListProps {
  items: readonly OrderItem[];
  products: OrderProductMap;
  isLoading?: boolean;
}

export function OrderProductList({
  items,
  products,
  isLoading = false,
}: OrderProductListProps) {
  if (isLoading && products.size === 0) {
    return (
      <div className="space-y-3" aria-label="주문 상품을 불러오는 중">
        {items.map((item) => (
          <div
            key={item.productId}
            className="h-24 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => {
        const product = products.get(item.productId);

        if (!product && isLoading) {
          return (
            <li
              key={item.productId}
              className="h-24 animate-pulse rounded-lg bg-neutral-100"
              aria-label={`${item.productId} 상품 정보를 불러오는 중`}
            />
          );
        }

        if (!product) {
          return (
            <li key={item.productId} className="py-5 text-[13px] text-discount">
              상품 정보를 불러오지 못했습니다. ({item.productId})
            </li>
          );
        }

        return (
          <li key={item.productId} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <Link
              href={`/products/${product.id}`}
              aria-label={`${product.name} 상세 보기`}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              <Image
                src={product.image}
                alt=""
                fill
                sizes="80px"
                className="size-full object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium uppercase tracking-wider text-text-caption">
                {product.brand}
              </p>
              <Link
                href={`/products/${product.id}`}
                className="mt-1 line-clamp-2 rounded-sm text-sm leading-5 text-text transition-colors hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
              >
                {product.name}
              </Link>
              <ProductLinePrice product={product} quantity={item.quantity} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
