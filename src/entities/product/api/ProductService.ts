import { ProductList, type ProductListResponse } from '../model'
import { ProductRepository } from './ProductRepository'

export class ProductService {
  constructor(private readonly repository = new ProductRepository()) {}

  async getProductList(apiQueryString: string): Promise<ProductListResponse> {
    const responseData = await this.repository.getProductList(apiQueryString)
    const productList = new ProductList(responseData)

    return {
      products: productList.products,
      totalCount: productList.totalCount,
    }
  }
}
