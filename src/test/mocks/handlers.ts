import { HttpResponse, http } from 'msw'
import { defaultProductListResponse } from '@/test/fixtures/products'

export const handlers = [
  http.get('http://localhost:3000/api/products', () =>
    HttpResponse.json(defaultProductListResponse),
  ),
]
