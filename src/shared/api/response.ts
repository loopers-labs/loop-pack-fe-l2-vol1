export type MockApiScenario = 'empty' | 'error';

export type ApiErrorResponse = {
  message: string;
};

const DEFAULT_DEV_PORT = 3000;

/* AI-generated : Week 7 Part 3 — NEXT_PUBLIC_SITE_URL → APP_ORIGIN으로 이름 변경. 이 값은
   typeof window === 'undefined' 가드 안에서만 쓰이는 서버 전용 설정인데, NEXT_PUBLIC_ 접두사가 붙어 있으면
   Next.js가 빌드 시점에 클라이언트 번들에도 문자열로 박아 넣는다. 접두사를 떼어 서버에만 남긴다 */
/** 서버(Server Component 등)에서 실행될 땐 상대경로를 못 풀어서 절대경로로 바꿔준다 */
function resolveUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path;
  }

  return `${getAppOrigin()}${path}`;
}

/** 서버에서 API·metadata가 공통으로 쓰는 절대 origin */
export function getAppOrigin(): string {
  return process.env.APP_ORIGIN ?? `http://localhost:${DEFAULT_DEV_PORT}`;
}

/** 네트워크 자체가 실패했을 때 사용자에게 보여줄 문구 */
const NETWORK_ERROR_MESSAGE =
  '네트워크에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
/** 서버가 실패했지만 응답 본문에서 이유를 꺼내지 못했을 때 보여줄 문구 */
const UNKNOWN_ERROR_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

/** 취소는 실패가 아니라 정상 흐름이므로 그대로 흘려보내야 한다(React Query가 취소로 처리) */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/* AI-generated : Week 7 Part 2 — signal을 받아 fetch에 그대로 전달. React Query의 queryFn이 넘겨주는
   AbortSignal을 연결하면, 쿼리 키가 바뀌어 무의미해진 이전 요청을 브라우저 차원에서 실제로 취소할 수 있다 */
/* AI-generated : Week 7 Part 2 — fetch가 던지는 원문 에러("Failed to fetch")가 ErrorRetry를 통해 사용자에게
   그대로 노출되던 문제. 네트워크 실패와 응답 파싱 실패를 각각 읽을 수 있는 문구로 바꾼다. 단 AbortError는
   취소 신호이므로 변환하지 않고 그대로 다시 던진다 */
export async function apiResponseResult(url: string, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(resolveUrl(url), { signal });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(body?.message ?? UNKNOWN_ERROR_MESSAGE);
  }

  return res.json();
}
