/** Next가 페이지에 넘겨주는 searchParams의 모양 */
export type PageSearchParams = Record<string, string | string[] | undefined>;

/**
 * 서버 컴포넌트에서 "지금 이 요청의 경로"를 복원한다.
 *
 * 보호 화면이 로그인으로 되돌릴 때 쓴다. proxy는 `request.nextUrl`에서 pathname과 search를
 * 그대로 읽지만, 서버 컴포넌트에는 요청 URL이 통째로 오지 않고 searchParams만 온다. 여기서
 * 다시 합치지 않으면 쿠키가 없을 때(proxy 경로)와 쿠키가 무효할 때(서버 검증 경로)의
 * 복원 규칙이 달라진다 — 전자는 쿼리를 보존하고 후자는 잃는다.
 *
 * @param pathname 이 페이지의 경로
 * @param searchParams 페이지가 받은 검색 파라미터
 */
export function toCurrentPath(pathname: string, searchParams: PageSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.append(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    }
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/** 배열로 들어온 값은 신뢰하지 않는다 — `?next=a&next=b`로 검증을 흔들 수 있다 */
export function readSingleParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}
