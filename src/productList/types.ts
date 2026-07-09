/**
 * 상품 도메인 모델
 * - 분리기준: Product 라는 도메인의 타입에 해당하는 타입만 분리하였습니다.
 */
export type ProductCategory = 'electronics' | 'fashion' | 'home' | 'beauty';

export type Product = {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  rating: number;
  reviewCount: number;
};
