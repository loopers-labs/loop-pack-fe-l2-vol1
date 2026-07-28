import { apiClient } from '@/api/apiClient';

//AI가 작성한 파일입니다.

export type SizeItem = { value: number; stock: number; delivery?: string };

export type PurchaseItem = {
  id: string;
  name: string;
  price: number;
  discountRate?: number;
  thumbnail: string;
  sameDayDelivery?: boolean;
  stock: number;
};

export type BundleItem = {
  id: string;
  label: string;
  promo?: string;
  price: number;
  quantity: number;
  freeShipping?: boolean;
  stock: number;
};

/** 데모 케이스별 옵션 데이터. */
export type ProductOptionsResponse = {
  demo1: SizeItem[];
  demo2: PurchaseItem[];
  demo3: BundleItem[];
};

// 데모 3종이 각각 호출해도 요청은 1번만 나가도록 모듈 레벨 캐시.
let cache: Promise<ProductOptionsResponse> | null = null;

export const getProductOptions = (): Promise<ProductOptionsResponse> => {
  if (!cache) cache = apiClient.get<ProductOptionsResponse>('/products');
  return cache;
};
