export type ApiErrorKind = 'http' | 'network'

type ApiErrorOptions = {
  kind: ApiErrorKind
  status?: number
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(message: string, { kind, status, cause }: ApiErrorOptions) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}
