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
 */
class ApiClient implements ApiClientOptions {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`GET ${url} 요청 실패: ${res.status}`);

      return Promise.reject(new Error(`GET ${url} 요청 실패: ${res.status}`));
    }

    return res.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
