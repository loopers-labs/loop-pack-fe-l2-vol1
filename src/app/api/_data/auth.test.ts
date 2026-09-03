import { afterEach, describe, expect, it } from 'vitest';
import {
  accounts,
  addOrder,
  createSessionToken,
  findAccount,
  isAuthScenario,
  isKnownProductId,
  listOrders,
  readSessionToken,
  resetOrders,
  TEST_PASSWORD,
} from './auth';
import { SESSION_TTL_SECONDS } from '@/shared/config/session';

const NOW = Date.parse('2026-08-21T00:00:00.000Z');

describe('auth accounts', () => {
  it('provides eight accounts so parallel workers can take one each', () => {
    expect(accounts).toHaveLength(8);
    expect(accounts.map((account) => account.email)).toEqual([
      'looper1@loopers.dev',
      'looper2@loopers.dev',
      'looper3@loopers.dev',
      'looper4@loopers.dev',
      'looper5@loopers.dev',
      'looper6@loopers.dev',
      'looper7@loopers.dev',
      'looper8@loopers.dev',
    ]);
    expect(new Set(accounts.map((account) => account.id)).size).toBe(8);
  });

  it('matches the shared password and rejects a wrong one', () => {
    expect(findAccount('looper3@loopers.dev', TEST_PASSWORD)).toMatchObject({
      email: 'looper3@loopers.dev',
    });
    expect(findAccount('looper3@loopers.dev', 'wrong-password')).toBeNull();
    expect(findAccount('unknown@loopers.dev', TEST_PASSWORD)).toBeNull();
  });

  it('ignores email case and surrounding spaces', () => {
    expect(findAccount('  LOOPER1@LOOPERS.DEV ', TEST_PASSWORD)).toMatchObject({
      id: accounts[0].id,
    });
  });
});

describe('session token', () => {
  it('round-trips a signed token before it expires', () => {
    const token = createSessionToken(accounts[0].id, NOW);
    expect(readSessionToken(token, NOW + 1_000)).toMatchObject({
      id: accounts[0].id,
    });
  });

  it('rejects a token at and after its expiry boundary', () => {
    const token = createSessionToken(accounts[0].id, NOW);
    const expiresAt = NOW + SESSION_TTL_SECONDS * 1_000;

    expect(readSessionToken(token, expiresAt - 1)).not.toBeNull();
    expect(readSessionToken(token, expiresAt)).toBeNull();
    expect(readSessionToken(token, expiresAt + 1)).toBeNull();
  });

  it('rejects a tampered payload, a tampered signature and malformed input', () => {
    const token = createSessionToken(accounts[0].id, NOW);
    const [payload, signature] = token.split('.');
    const otherPayload = createSessionToken(accounts[1].id, NOW).split('.')[0];

    expect(readSessionToken(`${otherPayload}.${signature}`, NOW)).toBeNull();
    expect(readSessionToken(`${payload}.${signature}x`, NOW)).toBeNull();
    expect(readSessionToken(payload, NOW)).toBeNull();
    expect(readSessionToken(undefined, NOW)).toBeNull();
    expect(readSessionToken('', NOW)).toBeNull();
  });

  it('rejects a token whose user no longer exists', () => {
    const token = createSessionToken('u999', NOW);
    expect(readSessionToken(token, NOW)).toBeNull();
  });
});

describe('scenario values', () => {
  it('accepts the four auth scenarios and nothing else', () => {
    expect(['invalid', 'expired', 'error', 'slow'].every(isAuthScenario)).toBe(true);
    expect(isAuthScenario('empty')).toBe(false);
    expect(isAuthScenario('')).toBe(false);
  });
});

describe('product id format', () => {
  it('accepts p1 through p30 and rejects anything outside that range', () => {
    expect(['p1', 'p9', 'p10', 'p29', 'p30'].every(isKnownProductId)).toBe(true);
    expect(['p0', 'p31', 'p999', 'p', 'p01', 'x1', ''].some(isKnownProductId)).toBe(false);
  });
});

describe('orders', () => {
  afterEach(() => {
    resetOrders();
  });

  it('keeps orders separated per user', () => {
    const first = addOrder(accounts[0].id, [{ productId: 'p1', quantity: 2 }]);
    addOrder(accounts[1].id, [{ productId: 'p2', quantity: 1 }]);

    expect(listOrders(accounts[0].id)).toEqual([first]);
    expect(listOrders(accounts[1].id)).toHaveLength(1);
    expect(listOrders('u999')).toEqual([]);
  });

  it('keeps the requested items and numbers each order', () => {
    const first = addOrder(accounts[0].id, [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    const second = addOrder(accounts[0].id, [{ productId: 'p3', quantity: 1 }]);

    expect(first.items).toEqual([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    expect(first.id).toBe('o1');
    expect(second.id).toBe('o2');
  });
});
