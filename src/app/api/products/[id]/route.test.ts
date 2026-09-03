import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from './route';

const request = (id: string) =>
  GET(new NextRequest(`http://localhost/api/products/${id}`), {
    params: Promise.resolve({ id }),
  });

describe('GET /api/products/[id]', () => {
  it('returns 200 with the product for an existing id (p1)', async () => {
    const response = await request('p1');
    const body = await response.json();

    expect(response.status).toBe(200);
    // toMatchObject 가 아니라 toEqual 이다. 상세 화면이 rating·reviewCount 를 그리는데
    // 부분 대조로는 그 필드가 통째로 빠져도 통과한다.
    expect(body.product).toEqual({
      id: 'p1',
      brand: 'Loopers Select',
      name: '[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG',
      category: 'casual',
      price: 79000,
      originalPrice: null,
      image: '/images/products/p1.jpg',
      freeShipping: true,
      rating: 4.8,
      reviewCount: 312,
      createdAt: '2026-07-09T09:00:00.000Z',
      sizes: [
        { value: 24, stock: 3 },
        { value: 25, stock: 0 },
        { value: 26, stock: 12 },
        { value: 27, stock: 5 },
        { value: 28, stock: 0 },
      ],
    });
  });

  it('returns 404 for a non-existent id', async () => {
    const response = await request('p999');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: '상품을 찾을 수 없습니다.' });
  });
});
