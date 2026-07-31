export interface BundleProduct {
  id: string;
  name: string;
  price: number;
  unitCount: number;
  freeShipping: boolean;
}

export interface ProductSize {
  value: number;
  stock: number;
}

export interface SizedProduct {
  id: string;
  name: string;
  sizes: ProductSize[];
}

export interface ThumbnailProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  todayDelivery: boolean;
}

export interface ProductCatalog {
  bundles: BundleProduct[];
  sneakers: SizedProduct;
  ampoules: ThumbnailProduct[];
}
