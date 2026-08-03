import type { Category, Product } from '@/entities/product'

// mock 백엔드 전용 타입. scenario는 검증용 제어값이라 클라이언트가 보내지 않고,
// 프론트엔드 레이어의 계약도 아니라서 Route Handler 곁에 둔다.
export type MockApiScenario = 'empty' | 'error'

export type ApiErrorResponse = {
  message: string
}

// mock 백엔드는 화면 슬라이스의 내부 응답 타입을 참조하지 않고 자기 응답 봉투를 소유한다.
// Product·Category는 fixture와 프론트엔드가 공유하는 도메인 계약만 재사용한다.
export type HomeApiResponse = {
  banner: { title: string; description: string; image: string }
  categories: Category[]
  popularProducts: Product[]
  newProducts: Product[]
}
