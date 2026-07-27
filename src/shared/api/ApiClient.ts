import { default as ky, HTTPError } from 'ky'

import type { ApiErrorResponse } from '@/shared/api/ApiErrorResponse'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

const parseErrorBody = async (
  response: Response,
): Promise<ApiErrorResponse | null> => {
  try {
    return (await response.json()) as ApiErrorResponse
  } catch {
    return null
  }
}

const toApiClientError = async (error: HTTPError): Promise<ApiClientError> => {
  const body = await parseErrorBody(error.response)
  return new ApiClientError(
    body?.message ?? '요청 중 오류가 발생했습니다.',
    error.response.status,
  )
}

/**
 * 공통 ky 인스턴스.
 * Next App Router 환경에서 같은 origin의 mock API(/api/*)를 호출한다.
 * baseURL을 두지 않고 상대 경로를 사용해 클라이언트/서버 양쪽에서 동작한다.
 */
export const apiClient = ky.create({
  hooks: {
    beforeError: [
      async (state) => {
        if (state.error instanceof HTTPError) {
          throw await toApiClientError(state.error)
        }
        return state.error
      },
    ],
  },
})
