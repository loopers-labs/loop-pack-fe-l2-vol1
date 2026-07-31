import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { GET } from './route';

const request = (query = '') => GET(new NextRequest(`http://localhost/api/products${query}`));

const allProductIds = async (sort: string) => {
  const firstPageBody = await (await request(`?sort=${sort}&page=1&pageSize=24`)).json();
  const secondPageBody = await (await request(`?sort=${sort}&page=2&pageSize=24`)).json();

  return [...firstPageBody.products, ...secondPageBody.products].map((product: { id: string }) => product.id);
};

const hugePositiveInteger = '9'.repeat(400);

describe('GET /api/products', () => {
  it('preserves Week 04 field shape while using the mapped source identity', async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.products).toHaveLength(12);
    expect(body.categories).toHaveLength(5);
    expect(body.categories).toEqual([
      { id: 'casual', name: '캐주얼' },
      { id: 'fashion', name: '패션' },
      { id: 'goods', name: '뷰티·잡화' },
      { id: 'home', name: '홈' },
      { id: 'digital', name: '디지털' },
    ]);
    expect(body.totalCount).toBe(30);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(12);
    expect(body.products[0]).toMatchObject({
      id: 'p1',
      brand: 'Loopers Select',
      name: '[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG',
      category: 'casual',
      price: 79000,
      originalPrice: null,
      image: '/images/products/p1.jpg',
      freeShipping: true,
      sizes: [
        { value: 24, stock: 3 },
        { value: 25, stock: 0 },
        { value: 26, stock: 12 },
        { value: 27, stock: 5 },
        { value: 28, stock: 0 },
      ],
    });
    expect(body.products[1]).toMatchObject({
      id: 'p2',
      brand: 'Loopers Select',
      name: '[Exclusive] Holiday Signature Ball Cap (20Colors)',
      category: 'casual',
      price: 39000,
      originalPrice: null,
      image: '/images/products/p2.jpg',
      freeShipping: false,
      sizes: [],
    });

    const allCategoryBody = await (await request('?category=all&pageSize=24')).json();
    expect(allCategoryBody.totalCount).toBe(30);
  });

  it('matches representative source products across all five image groups', async () => {
    const body = await (await request('?pageSize=24')).json();
    const secondPageBody = await (await request('?page=2&pageSize=24')).json();
    const products = [...body.products, ...secondPageBody.products];

    expect(
      products.filter((product: { id: string }) => ['p1', 'p6', 'p11', 'p16', 'p21'].includes(product.id)),
    ).toMatchObject([
      {
        id: 'p1',
        brand: 'Loopers Select',
        name: '[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG',
        category: 'casual',
        price: 79000,
        originalPrice: null,
      },
      { id: 'p6', name: 'WOMAN GNRL 케이블 풀오버 [IVORY] / WBC3L05502', category: 'fashion', price: 69000 },
      {
        id: 'p11',
        brand: '인스테드',
        name: '하이드레이팅 나이트 립 마스크 25g + 소프트 글로우 결 토너 210ml',
        category: 'goods',
        price: 48000,
        originalPrice: 58000,
      },
      {
        id: 'p16',
        brand: '스탠리',
        name: '스탠리 클래식 런치박스',
        category: 'home',
        price: 75000,
        originalPrice: 89000,
      },
      {
        id: 'p21',
        brand: '메이커스',
        name: '메이커스 투명케이스',
        category: 'digital',
        price: 23000,
        originalPrice: 29000,
      },
    ]);
  });

  it('returns one unique local image for every product', async () => {
    const firstPageBody = await (await request('?pageSize=24')).json();
    const secondPageBody = await (await request('?pageSize=24&page=2')).json();
    const products = [...firstPageBody.products, ...secondPageBody.products];
    const images = products.map((product: { image: string }) => product.image);

    expect(products).toHaveLength(30);
    images.forEach((image: string) => {
      expect(image).toMatch(/^\/images\/products\/p\d+\.jpg$/);
    });
    expect(new Set(images).size).toBe(30);
    expect(images.some((image: string) => image.startsWith('http'))).toBe(false);
  });

  it('searches explicit brands and source names without case sensitivity', async () => {
    const response = await request('?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&pageSize=24');
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual(['p16', 'p17', 'p19', 'p20']);

    const caseResponse = await request('?q=%20%20winter%20rocky%20%20&pageSize=24');
    const caseBody = await caseResponse.json();
    expect(caseBody.products.map((product: { id: string }) => product.id)).toEqual(['p1']);
  });

  it('filters category and sorts popularity deterministically', async () => {
    const response = await request('?category=digital&sort=popular&pageSize=24');
    const body = await response.json();
    expect(body.products.map((product: { id: string }) => product.id)).toEqual([
      'p21',
      'p22',
      'p30',
      'p23',
      'p25',
      'p24',
    ]);
    expect(
      body.products
        .filter((product: { id: string }) => ['p22', 'p30'].includes(product.id))
        .map((product: { id: string; rating: number; reviewCount: number }) => ({
          id: product.id,
          rating: product.rating,
          reviewCount: product.reviewCount,
        })),
    ).toEqual([
      { id: 'p22', rating: 4.6, reviewCount: 689 },
      { id: 'p30', rating: 4.5, reviewCount: 689 },
    ]);
  });

  it.each([
    [
      'latest',
      [
        'p26',
        'p6',
        'p27',
        'p24',
        'p1',
        'p28',
        'p19',
        'p2',
        'p29',
        'p11',
        'p22',
        'p3',
        'p30',
        'p7',
        'p16',
        'p12',
        'p9',
        'p15',
        'p8',
        'p13',
        'p4',
        'p18',
        'p21',
        'p5',
        'p20',
        'p25',
        'p10',
        'p17',
        'p14',
        'p23',
      ],
    ],
    [
      'popular',
      [
        'p21',
        'p11',
        'p15',
        'p8',
        'p22',
        'p30',
        'p14',
        'p18',
        'p6',
        'p12',
        'p23',
        'p16',
        'p5',
        'p25',
        'p20',
        'p10',
        'p1',
        'p24',
        'p13',
        'p7',
        'p4',
        'p28',
        'p2',
        'p17',
        'p27',
        'p9',
        'p29',
        'p3',
        'p19',
        'p26',
      ],
    ],
    [
      'price-asc',
      [
        'p29',
        'p30',
        'p25',
        'p21',
        'p24',
        'p15',
        'p3',
        'p22',
        'p2',
        'p23',
        'p17',
        'p20',
        'p11',
        'p28',
        'p14',
        'p9',
        'p12',
        'p19',
        'p6',
        'p13',
        'p26',
        'p16',
        'p1',
        'p10',
        'p8',
        'p5',
        'p4',
        'p18',
        'p27',
        'p7',
      ],
    ],
    [
      'price-desc',
      [
        'p7',
        'p27',
        'p18',
        'p4',
        'p5',
        'p8',
        'p10',
        'p1',
        'p16',
        'p26',
        'p6',
        'p13',
        'p19',
        'p12',
        'p9',
        'p14',
        'p28',
        'p11',
        'p20',
        'p17',
        'p23',
        'p2',
        'p22',
        'p3',
        'p15',
        'p24',
        'p21',
        'p25',
        'p30',
        'p29',
      ],
    ],
  ])('returns the complete %s order', async (sort, expectedIds) => {
    expect(await allProductIds(sort)).toEqual(expectedIds);
  });

  it('returns an empty page when page exceeds the filtered result', async () => {
    const response = await request('?category=casual&page=9&pageSize=12');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.products).toEqual([]);
    expect(body.totalCount).toBe(6);
  });

  it.each([
    '?category=unknown',
    '?category=food',
    '?category=beauty',
    '?sort=random',
    '?scenario=unknown',
    '?page=0',
    '?page=-1',
    '?page=1.5',
    '?pageSize=0',
    '?pageSize=25',
    '?pageSize=1.5',
    `?page=${hugePositiveInteger}`,
    `?pageSize=${hugePositiveInteger}`,
  ])('rejects invalid query %s', async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: '요청 조건을 확인해주세요.' });
  });

  it('validates request inputs before applying the error scenario', async () => {
    const response = await request('?scenario=error&page=0');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: '요청 조건을 확인해주세요.' });
  });

  it('supports deterministic empty and error scenarios', async () => {
    const emptyResponse = await request('?scenario=empty&category=digital&page=2&pageSize=3');
    const emptyBody = await emptyResponse.json();

    expect(emptyResponse.status).toBe(200);
    expect(emptyBody.products).toEqual([]);
    expect(emptyBody.totalCount).toBe(0);
    expect(emptyBody.categories).toEqual([
      { id: 'casual', name: '캐주얼' },
      { id: 'fashion', name: '패션' },
      { id: 'goods', name: '뷰티·잡화' },
      { id: 'home', name: '홈' },
      { id: 'digital', name: '디지털' },
    ]);
    expect(emptyBody.page).toBe(2);
    expect(emptyBody.pageSize).toBe(3);

    const errorResponse = await request('?scenario=error');
    expect(errorResponse.status).toBe(500);
    expect(await errorResponse.json()).toEqual({ message: '상품 목록을 불러오지 못했습니다.' });
  });
});
