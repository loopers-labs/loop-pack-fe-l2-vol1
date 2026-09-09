// proxy.ts의 matcher와 이 목록은 항상 같은 경로를 가리켜야 한다.
// matcher는 Next.js가 빌드 타임에 정적 분석해야 해서 리터럴이어야 하므로
// 여기서 직접 가져다 쓸 수는 없고, 값만 손으로 맞춰서 유지한다.
const PROTECTED_PATH_PREFIXES = ['/orders'] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
