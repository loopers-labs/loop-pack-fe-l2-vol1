// [AI] 홈 화면 집합 타입. HomeResponse는 도메인 명사가 아닌 화면 조합이라 widget이 소유한다.
import type { Category, Product } from '@/entities/product/model';

export type HomeCategory = '인기 상품' | '신상품';

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};
