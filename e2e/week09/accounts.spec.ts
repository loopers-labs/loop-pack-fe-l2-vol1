import { expect, test } from '@playwright/test'
import { getAuthStatePath, getWorkerAccount } from './accounts'

test.describe('week 9 worker accounts', () => {
  test('maps the first four parallel workers to distinct accounts', () => {
    expect(
      Array.from({ length: 4 }, (_, index) => getWorkerAccount(index).id),
    ).toEqual(['u1', 'u2', 'u3', 'u4'])
  })

  test('wraps a parallel worker index within the eight accounts', () => {
    expect(getWorkerAccount(8).id).toBe('u1')
    expect(getWorkerAccount(15).id).toBe('u8')
  })

  test('keeps each worker state under the ignored authentication results directory', () => {
    const paths = Array.from({ length: 4 }, (_, index) =>
      getAuthStatePath(index),
    )

    expect(new Set(paths).size).toBe(4)
    for (const [index, statePath] of paths.entries()) {
      expect(statePath.replaceAll('\\', '/')).toMatch(
        new RegExp(`/test-results/\\.auth/worker-${index}\\.json$`),
      )
    }
  })
})
