// AI 생성
import { apiFetch } from '@/shared/api/apiFetch';
import type { Category, Product } from '@/entities/product';

export type HomeResponse = {
  banner: { title: string; description: string; image: string };
  categories: Category[];
  popularProducts: Product[];
  newProducts: Product[];
};

// AI 생성: week-07 3단계 — metadata의 query failure(APP_ORIGIN 불능) 재현을 위해 서버도
// Route Handler를 절대 URL로 호출한다(week-05 direct-call 우회 폐기, docs/work/week-07/measurement-and-decisions.md 참고).
export function getHome(): Promise<HomeResponse> {
  return apiFetch('/api/home');
}
