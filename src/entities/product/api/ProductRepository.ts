export class ProductRepository {
  async getProductList(apiQueryString: string): Promise<unknown> {
    const res = await fetch(`/api/products?${apiQueryString}`)

    if (!res.ok) {
      throw new Error(`API 호출 실패 (status: ${String(res.status)})`)
    }

    const responseJson: unknown = await res.json()

    return responseJson
  }
}
