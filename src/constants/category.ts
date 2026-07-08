import type { Product } from '@/types/product';

export const CATEGORY_LABEL: Record<Product['category'], string> = {
  electronics: '가전·디지털',
  fashion: '패션·잡화',
  home: '홈·리빙',
  beauty: '뷰티',
};

export type Category = 'all' | Product['category'];

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'electronics', label: '가전·디지털' },
  { key: 'fashion', label: '패션·잡화' },
  { key: 'home', label: '홈·리빙' },
  { key: 'beauty', label: '뷰티' },
];
