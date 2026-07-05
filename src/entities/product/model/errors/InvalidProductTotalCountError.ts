export class InvalidProductTotalCountError extends Error {
  constructor() {
    super('상품 개수 데이터 형식이 올바르지 않습니다.')
    this.name = 'InvalidProductTotalCountError'
    Object.setPrototypeOf(this, InvalidProductTotalCountError.prototype)
  }
}
