export const API_ERROR_FALLBACK_MESSAGE = '요청 중 오류가 발생했습니다.'

export class ApiClientError extends Error {
  readonly name = 'ApiClientError'

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
