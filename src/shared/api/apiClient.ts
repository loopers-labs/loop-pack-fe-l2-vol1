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
 * - SSR 대응 : 브라우저는 상대경로(`/api`)면 현재 origin으로 해석되지만, 서버(SSR prefetch)에는 origin이 없어 절대 URL이 필요합니다. 서버에서는 `APP_ORIGIN`(없으면 localhost)로 origin을 붙여 서버·클라 공용으로 씁니다.
 *   `NEXT_PUBLIC_` 접두사를 쓰지 않습니다: 이 값은 서버 분기에서만 읽으므로 클라이언트 번들에 인라인될 이유가 없습니다.
 */
class ApiClient implements ApiClientOptions {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(endpoint: string): string {
    const base =
      typeof window === 'undefined'
        ? `${process.env.APP_ORIGIN ?? 'http://localhost:3000'}${this.baseUrl}`
        : this.baseUrl;

    return `${base}${endpoint}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = this.resolveUrl(endpoint);

    let res: Response;

    try {
      res = await fetch(url);
    } catch (cause) {
      // 서버에 닿지도 못한 경우. HTTP 실패와 구분해야 호출부가 재시도 여부를 판단할 수 있다.
      throw new NetworkError(`GET ${url} 요청이 네트워크 단계에서 실패했습니다.`, { cause });
    }

    if (!res.ok) {
      // API 계약상 실패 응답은 { message } 형태다. 있으면 그 메시지로, 없으면 상태코드로 실패시킨다.
      const body = (await res.json().catch(() => null)) as Partial<ApiErrorResponse> | null;
      const message = body?.message ?? `GET ${url} 요청 실패: ${res.status}`;

      // status 를 살려 던진다. 4xx/5xx 구분은 호출부의 판단 재료다.
      throw new HttpError(res.status, message);
    }

    return res.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
