export class ProductServerFetchError extends Error {
  readonly name = 'ProductServerFetchError'

  constructor(readonly cause: TypeError) {
    super(cause.message, { cause })
  }
}
