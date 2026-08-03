import { default as ky, HTTPError } from 'ky'

import { ApiErrorResponseSchema } from '@/shared/api/ApiErrorResponse'

const API_ERROR_FALLBACK_MESSAGE = '요청 중 오류가 발생했습니다.'

export class ApiClientError extends Error {
  readonly name = 'ApiClientError'

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/**
 * 공통 ky 인스턴스.
 * Next App Router 환경에서 같은 origin의 mock API(/api/*)를 호출한다.
 * baseURL을 두지 않고 상대 경로를 사용해 클라이언트/서버 양쪽에서 동작한다.
 */
export const apiClient = ky.create({
  retry: 0,
  hooks: {
    beforeError: [
      (state) => {
        if (state.error instanceof HTTPError) {
          const result = ApiErrorResponseSchema.safeParse(state.error.data)
          return new ApiClientError(
            result.success ? result.data.message : API_ERROR_FALLBACK_MESSAGE,
            state.error.response.status,
          )
        }
        return state.error
      },
    ],
  },
})
