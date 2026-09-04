import { isSafeRedirect } from '@/shared/lib/isSafeRedirect';

const HOME_PATH = '/';

// next는 비어 있을 수 있고, 로그인 화면은 공개 페이지라 값이 우리가 만든 것이라는 보장이 없다.
// 값의 출처가 아니라 형태로 판단한다 — 빈 값을 먼저 거르고, 남은 값만 origin 비교로 검증한다.
//
// 검증은 origin 단위로 하되 넘길 때는 경로만 남긴다. 절대 URL을 그대로 router.replace에 주면
// 라우터가 외부 주소로 판정할 때 하드 내비게이션으로 갈려 히스토리 엔트리 대체가 깨질 수 있다.
export function resolveLoginDestination(next: string | null, origin: string): string {
  if (next === null || next === '' || !isSafeRedirect(next, origin)) {
    return HOME_PATH;
  }

  const { pathname, search, hash } = new URL(next, origin);
  return pathname + search + hash;
}
