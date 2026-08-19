import { http, HttpResponse } from 'msw';

import { HOME_RESPONSE, PRODUCT_LIST_RESPONSE } from './fixtures';

export const handlers = [
  http.get('*/api/home', () => HttpResponse.json(HOME_RESPONSE)),
  http.get('*/api/products', () => HttpResponse.json(PRODUCT_LIST_RESPONSE)),
];
