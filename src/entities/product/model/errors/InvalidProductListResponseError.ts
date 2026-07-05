export class InvalidProductListResponseError extends Error {
  constructor() {
    super('상품 목록 응답 형식이 올바르지 않습니다.')
    this.name = 'InvalidProductListResponseError'
    Object.setPrototypeOf(this, InvalidProductListResponseError.prototype)
  }
}
