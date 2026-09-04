import { afterEach, describe, expect, it } from 'vitest';
import { recordProvider } from './recordProvider';
import { getOrCreateSessionId } from './session';

const RECORDS_KEY = 'analytics.records';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readRecords(): Array<Record<string, unknown>> {
  const parsed: unknown = JSON.parse(sessionStorage.getItem(RECORDS_KEY) ?? '[]');
  return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
}

describe('recordProvider', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('레코드를 시드 모양(sessionId·ts·name·props·device 최상위)으로 남긴다', () => {
    recordProvider.track('cart_add', { sessionId: 's_1', ts: '2026-09-04T00:00:00.000Z', device: 'mobile', productId: 'p1', quantity: 1 });

    const [record] = readRecords();
    expect(record).toEqual({
      sessionId: 's_1',
      ts: '2026-09-04T00:00:00.000Z',
      name: 'cart_add',
      props: { productId: 'p1', quantity: 1 },
      device: 'mobile'
    });
  });

  it('userId가 없으면 키 자체가 레코드에 없다 (시드도 일부 이벤트에만 존재)', () => {
    recordProvider.track('cart_add', { sessionId: 's_1', ts: '2026-09-04T00:00:00.000Z', device: null, productId: 'p1' });

    const [record] = readRecords();
    expect('userId' in record).toBe(false);
  });

  it('userId가 있으면 최상위에 포함된다', () => {
    recordProvider.track('login_success', { sessionId: 's_1', ts: '2026-09-04T00:00:00.000Z', device: null, userId: 'u1', from: null });

    const [record] = readRecords();
    expect(record.userId).toBe('u1');
  });

  it('두 번 track하면 sessionStorage에 누적된다 — 전체 페이지 이동 생존의 핵심', () => {
    recordProvider.track('product_list_view', { sessionId: 's_1', ts: 't1', device: null, category: 'all', sort: 'popular', page: 1 });
    recordProvider.track('cart_add', { sessionId: 's_1', ts: 't2', device: null, productId: 'p1' });

    expect(readRecords()).toHaveLength(2);
  });

  it('initialize()는 기존 레코드를 지우지 않는다', () => {
    recordProvider.track('product_list_view', { sessionId: 's_1', ts: 't1', device: null, category: 'all', sort: 'popular', page: 1 });
    void recordProvider.initialize();

    expect(readRecords()).toHaveLength(1);
  });
});

describe('getOrCreateSessionId', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('두 번 불러도 같은 값을 돌려준다', () => {
    expect(getOrCreateSessionId()).toBe(getOrCreateSessionId());
  });
});
