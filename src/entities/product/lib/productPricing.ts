import type { Product } from '@/entities/product/model/types';

export interface ProductDiscount {
  originalPrice: number;
  rate: number;
  unitAmount: number;
}

export interface ProductPriceSummary {
  originalTotal: number;
  discountTotal: number;
  paymentTotal: number;
}

interface ProductQuantity {
  productId: string;
  quantity: number;
}

type ProductPrice = Pick<Product, 'price' | 'originalPrice'>;
type ProductMap = ReadonlyMap<string, Product>;

export function getProductDiscount({
  price,
  originalPrice,
}: ProductPrice): ProductDiscount | null {
  if (originalPrice === null || originalPrice <= price) return null;

  return {
    originalPrice,
    rate: Math.round(((originalPrice - price) / originalPrice) * 100),
    unitAmount: originalPrice - price,
  };
}

export function getProductPriceSummary(
  items: readonly ProductQuantity[],
  products: ProductMap,
): ProductPriceSummary {
  return items.reduce<ProductPriceSummary>(
    (summary, item) => {
      const product = products.get(item.productId);

      if (!product) return summary;

      const discount = getProductDiscount(product);
      const paymentAmount = product.price * item.quantity;
      const discountAmount = (discount?.unitAmount ?? 0) * item.quantity;

      return {
        originalTotal:
          summary.originalTotal + paymentAmount + discountAmount,
        discountTotal: summary.discountTotal + discountAmount,
        paymentTotal: summary.paymentTotal + paymentAmount,
      };
    },
    { originalTotal: 0, discountTotal: 0, paymentTotal: 0 },
  );
}
