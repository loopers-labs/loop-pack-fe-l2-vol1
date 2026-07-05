export class InvalidProductListDataError extends Error {
  constructor() {
    super('상품 목록 데이터 형식이 올바르지 않습니다.')
    this.name = 'InvalidProductListDataError'
    Object.setPrototypeOf(this, InvalidProductListDataError.prototype)
  }
}
