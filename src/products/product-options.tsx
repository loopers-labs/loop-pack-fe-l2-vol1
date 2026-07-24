import type { Product } from "./api/types";
import { SizeSkin, ThumbnailSkin, BundleSkin } from "./skins";

export interface ProductOptionsProps {
  product: Product;
}

export function ProductOptions({ product }: ProductOptionsProps) {
  switch (product.optionKind) {
    case "size":
      return <SizeSkin options={product.options} />;
    case "thumbnail":
      return <ThumbnailSkin options={product.options} />;
    case "bundle":
      return <BundleSkin options={product.options} />;
    default: {
      const _exhaustive: never = product;
      throw new Error(`알 수 없는 optionKind입니다: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
