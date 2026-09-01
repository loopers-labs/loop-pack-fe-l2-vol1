import { getAppOrigin } from '../config/appOrigin';
import { AUTH_REASON_PARAM, LOGIN_PATH, RETURN_TO_PARAM, isProtectedPath } from '../config/routes';
import { isSafeRedirect } from '../lib/isSafeRedirect';
import { HttpError, NetworkError } from './httpError';
import type { ApiErrorResponse } from './types';

const API_BASE_URL = '/api';

interface ApiClientOptions {
  /**
   * API BaseUrl
   */
  baseUrl: string;
}

/**
 * 공통 fetch 래퍼 (현재 GET 한정)
 *
 * - 분리 근거 : fetch를 메서드 별로 쓸 수 있게 분리하지 없으면 각 service 함수가 fetch를 사용하기 위한 baseUrl 하드코딩, method 주입을 반복해서 적어야한다고 생각하였습니다.
 * 프로젝트에서 api 호출은 product 도메인 하나로 끝나지 않기 때문에 전역 레이어로 분리해도 괜찮다 판단하였고, Url QueryString 첨부는 사용하는 service 함수의 관심사라라고 생각하여 해당 클래스에서는 분리하였습니다.
 * - SSR 대응 : 브라우저는 상대경로(`/api`)면 현재 origin으로 해석되지만, 서버(SSR prefetch)에는 origin이 없어 절대 URL이 필요합니다. 서버에서는 `APP_ORIGIN`로 origin을 붙여 서버·클라 공용으로 씁니다.
 *   `NEXT_PUBLIC_` 접두사를 쓰지 않습니다: 이 값은 서버 분기에서만 읽으므로 클라이언트 번들에 인라인될 이유가 없습니다.
 */
class ApiClient implements ApiClientOptions {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(endpoint: string): string {
    // getAppOrigin() 은 서버 분기 안에서만 부른다. 클라이언트 번들에는 APP_ORIGIN 이 없다.
    const base = typeof window === 'undefined' ? `${getAppOrigin()}${this.baseUrl}` : this.baseUrl;

    return `${base}${endpoint}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await this.request('GET', endpoint);

    return res.json() as Promise<T>;
  }

  /**
   * 본문이 있으면 JSON 으로 보낸다. 204 No Content 면 파싱할 것이 없어 null 을 돌려준다.
   * 로그아웃처럼 응답 본문이 없는 API 가 있어 반환 타입에 null 을 포함시킨다.
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T | null> {
    const res = await this.request('POST', endpoint, body);

    if (res.status === 204) {
      return null;
    }

    return res.json() as Promise<T>;
  }

  /**
   * 요청 한 번의 공통 경로. URL 해석, 네트워크 실패 구분, 401 인터셉터, 에러 변환을 여기 모은다.
   * 메서드별로 복사하면 인터셉터가 GET 에만 걸리는 식으로 조용히 어긋난다.
   */
  private async request(method: 'GET' | 'POST', endpoint: string, body?: unknown): Promise<Response> {
    const url = this.resolveUrl(endpoint);

    let res: Response;

    try {
      res = await fetch(url, {
        method,
        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
    } catch (cause) {
      // 서버에 닿지도 못한 경우. HTTP 실패와 구분해야 호출부가 재시도 여부를 판단할 수 있다.
      throw new NetworkError(`${method} ${url} 요청이 네트워크 단계에서 실패했습니다.`, { cause });
    }

    if (!res.ok) {
      // [클라이언트 401 인터셉터] 세션 만료 처리는 이 한 곳에서만 한다. 화면별로 분산하지 않는다.
      //
      // 만료 판정 신호는 "지금 보고 있는 화면이 보호 경로인가"다. 세션 쿠키를 읽어 판정하지
      // 않는다 — session 은 httpOnly 라 document.cookie 에 절대 나타나지 않고, 읽으려 들면
      // 항상 미로그인으로 보여 이 분기가 통째로 죽는다. jsdom 은 httpOnly 를 강제하지 않아
      // 테스트만 초록으로 통과하는, 가장 잡기 어려운 형태로 죽는다.
      //
      // 보호 경로에 있다는 것은 proxy 의 쿠키 검사를 이미 통과했다는 뜻이므로 이 401 은 만료다.
      // 공개 경로의 401 은 그냥 "로그인 안 함"이라 리다이렉트하지 않고 에러로 흘려보낸다.
      if (res.status === 401 && typeof window !== 'undefined' && isProtectedPath(window.location.pathname)) {
        const rawPath = `${window.location.pathname}${window.location.search}`;
        const returnTo = isSafeRedirect(rawPath) ? rawPath : '/';
        const params = new URLSearchParams({
          [RETURN_TO_PARAM]: returnTo,
          [AUTH_REASON_PARAM]: 'expired',
        });

        window.location.href = `${LOGIN_PATH}?${params.toString()}`;

        // 이동이 확정된 뒤에는 호출부가 실패를 또 처리할 이유가 없다.
        // 영원히 pending 인 promise 로 후속 처리를 멈춘다.
        return new Promise<Response>(() => {});
      }

      // API 계약상 실패 응답은 { message } 형태다. 있으면 그 메시지로, 없으면 상태코드로 실패시킨다.
      const errorBody = (await res.json().catch(() => null)) as Partial<ApiErrorResponse> | null;
      const message = errorBody?.message ?? `${method} ${url} 요청 실패: ${res.status}`;

      // status 를 살려 던진다. 4xx/5xx 구분은 호출부의 판단 재료다.
      throw new HttpError(res.status, message);
    }

    return res;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
