import { HttpResponse, http } from 'msw';
import { productListFixture } from './fixtures';

export const handlers = [
  http.get('*/api/products', () => HttpResponse.json(productListFixture)),
];
