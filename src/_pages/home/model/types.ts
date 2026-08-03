import type { Category, Product } from '@/entities/product';

/**
 * 홈 화면 응답 계약.
 *
 * 배너·카테고리·인기·신상품을 한 덩어리로 묶은 화면 주도 응답이라
 * 이 shape 을 정하는 주체는 product 엔티티가 아니라 홈 화면이다.
 *
 * mock 백엔드(app/api/home/route.ts)도 이 타입을 반환 타입으로 쓴다.
 * mock 은 프론트 개발용 스텁이므로 계약의 소유자는 프론트다.
 * shared 에 두면 shared 가 entities 를 알게 되어 의존 방향이 뒤집히고,
 * mock 영역에 두면 _pages 가 app 을 import 하게 되어 역시 뒤집힌다.
 */
export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};
