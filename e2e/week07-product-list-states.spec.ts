import { expect, test } from '@playwright/test'
import {
  recordProductApiCalls,
  saveObservation,
  snapshot,
  type Snapshot,
} from './observe'

// 2단계가 요구하는 여섯 화면 중, 전환 스펙(week07-product-list-before)이 다루지 않는
// 나머지를 관측한다 — 성공+0건 · 최초 실패 · 갱신 실패.
//
// 실패는 page.route로 과제 API와 같은 500 응답을 재현한다.

const SLOW_DELAY_MS = 1500
const SETTLE_MS = 5000
const ERROR_SETTLE_MS = 10000
const ERROR_DELAY_MS = 1500
const REAL_GRID = '.week05-grid:not([aria-hidden="true"])'

test.describe('목록 나머지 화면 관측 (scenario=slow)', () => {
  test('5. 성공 + 0건 — 조건과 0개임을 확정해 보여주는가', async ({
    page,
  }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products')
    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })

    // 어떤 상품 이름·브랜드에도 없는 검색어
    const searchInput = page.getByRole('textbox', { name: '검색' })
    await searchInput.fill('존재하지않는상품명zzz')
    await searchInput.press('Enter')
    await page.waitForTimeout(SLOW_DELAY_MS + 800)

    const empty = await snapshot(page, '빈 결과 확정', t0())
    snapshots.push(empty)

    await saveObservation(info, {
      calls,
      snapshots,
      emptyText: empty.emptyText,
    })

    // 오류가 아니라 "빈 결과"로 보여야 한다.
    expect(empty.emptyText).not.toBeNull()
    expect(empty.emptyText).toContain('존재하지않는상품명zzz')
    expect(empty.emptyText).toContain('0개')
    expect(empty.statusText).toBeNull()
    expect(new URL(empty.url).searchParams.get('q')).toBe(
      '존재하지않는상품명zzz',
    )
    expect(new URLSearchParams(calls.at(-1)?.search).get('q')).toBe(
      '존재하지않는상품명zzz',
    )
  })

  test('6. 최초 실패 — 목록 대신 이유와 재시도를 보여주는가', async ({
    page,
  }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products?scenario=error')
    await page.waitForTimeout(200)
    const pending = await snapshot(page, '최초 실패 응답 전', t0())
    snapshots.push(pending)
    expect(pending.skeletonCardCount).toBe(12)
    await page.waitForTimeout(ERROR_SETTLE_MS)
    const failed = await snapshot(page, '최초 실패', t0())
    snapshots.push(failed)

    await saveObservation(info, { calls, snapshots })

    // 보여줄 목록이 없으므로 목록 자리를 오류가 대신한다.
    expect(failed.statusText).not.toBeNull()
    expect(failed.listVisible).toBe(false)
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })

  test('7. 갱신 실패 — 기존 목록을 유지한 채 알리는가', async ({
    page,
  }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products')
    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })
    const initial = await snapshot(page, '전체 목록', t0())
    snapshots.push(initial)

    await page.getByLabel('카테고리').selectOption('digital')
    await expect(page.locator(REAL_GRID)).toHaveAttribute(
      'aria-busy',
      'false',
      {
        timeout: SETTLE_MS,
      },
    )
    await page.getByLabel('카테고리').selectOption('all')
    await expect(page.locator(REAL_GRID)).toHaveAttribute('aria-busy', 'false')
    const beforeFailure = await snapshot(page, '실패 직전 캐시 목록', t0())
    snapshots.push(beforeFailure)

    let failureCount = 0
    await page.route('**/api/products**', async (route) => {
      failureCount += 1
      if (failureCount === 1) {
        await new Promise((resolve) => setTimeout(resolve, ERROR_DELAY_MS))
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: '요청 조건을 확인해주세요.' }),
      })
    })

    await page.getByLabel('카테고리').selectOption('fashion')
    await page.waitForTimeout(200)
    const refreshing = await snapshot(page, '갱신 실패 응답 전', t0())
    snapshots.push(refreshing)
    await page.waitForTimeout(ERROR_SETTLE_MS)
    const failed = await snapshot(page, '갱신 실패 후', t0())
    snapshots.push(failed)

    await saveObservation(info, { calls, snapshots })

    // 목록은 남아 있고, 실패는 인라인으로 알린다.
    expect(failed.listVisible).toBe(true)
    expect(failed.inlineErrorVisible).toBe(true)
    expect(beforeFailure.listProductIds).toEqual(initial.listProductIds)
    expect(refreshing.listProductIds).toEqual(beforeFailure.listProductIds)
    expect(refreshing.listAriaBusy).toBe('true')
    expect(failed.listProductIds).toEqual(beforeFailure.listProductIds)
    expect(failed.listAriaBusy).toBe('false')
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })

  test('8. 예상치 못한 응답 형태는 상품 목록 Error Boundary가 처리한다', async ({
    page,
  }) => {
    await page.route('**/api/products**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: null,
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
        }),
      }),
    )

    // 서버 prefetch 결과가 hydration되는 정상 경로에서는 브라우저 route가
    // 첫 결과를 바꿀 수 없으므로, 서버 prefetch를 실패시킨 뒤 client 응답을 검증한다.
    await page.goto('/products?scenario=error')

    await expect(
      page.getByText('상품 목록을 불러오는 중 문제가 발생했습니다.'),
    ).toBeVisible({ timeout: SETTLE_MS })
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()
  })
})
