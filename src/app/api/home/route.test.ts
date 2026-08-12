import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const request = (query = '') => GET(new NextRequest(`http://localhost/api/home${query}`));

describe('GET /api/home', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('returns banner, categories, popular products, and new products', async () => {
    const response = await request();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner).toEqual({
      title: '매일 새롭게 발견하는 취향',
      description: '지금 가장 사랑받는 상품을 만나보세요.',
      image: '/images/week-07/hero-original.jpg',
    });
    expect(body.categories).toEqual([
      { id: 'casual', name: '캐주얼' },
      { id: 'fashion', name: '패션' },
      { id: 'goods', name: '뷰티·잡화' },
      { id: 'home', name: '홈' },
      { id: 'digital', name: '디지털' },
    ]);
    expect(body.popularProducts.map((product: { id: string }) => product.id)).toEqual([
      'p21',
      'p11',
      'p15',
      'p8',
      'p22',
      'p30',
    ]);
    expect(body.newProducts.map((product: { id: string }) => product.id)).toEqual([
      'p26',
      'p6',
      'p27',
      'p24',
      'p1',
      'p28',
    ]);
  });

  it('keeps banner and categories in the empty scenario', async () => {
    const response = await request('?scenario=empty');
    const body = await response.json();
    expect(body.banner).toBeDefined();
    expect(body.categories).toHaveLength(5);
    expect(body.popularProducts).toEqual([]);
    expect(body.newProducts).toEqual([]);
  });

  it('returns a deterministic error scenario', async () => {
    const response = await request('?scenario=error');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: '홈 데이터를 불러오지 못했습니다.' });
  });

  it('keeps the home response pending for 1.5 seconds in the slow scenario', async () => {
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'production');

    let settled = false;
    const responsePromise = request('?scenario=slow').then((response) => {
      settled = true;
      return response;
    });

    await vi.advanceTimersByTimeAsync(1_499);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const response = await responsePromise;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.banner.image).toBe('/images/week-07/hero-original.jpg');
    expect(body.popularProducts).toHaveLength(6);
    expect(body.newProducts).toHaveLength(6);
  });

  it('rejects an unknown scenario', async () => {
    const response = await request('?scenario=unknown');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: '요청 조건을 확인해주세요.' });
  });
});
