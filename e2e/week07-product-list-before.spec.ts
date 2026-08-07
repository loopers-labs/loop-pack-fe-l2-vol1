import { expect, test } from '@playwright/test'
import {
  recordProductApiCalls,
  saveObservation,
  snapshot,
  type Snapshot,
} from './observe'

// 목록(slow)의 화면 전환 관측 — 0단계 Before와 2단계 After를 같은 계기로 잰다.
//
// 목적은 통과/실패가 아니라 "무엇이 보였는가"를 재현 가능하게 남기는 것이다.
// 그래서 단정(expect)은 관측을 깨뜨리지 않는 최소한만 쓰고, 나머지는 기록으로 남긴다.
// 산출물: 테스트별 video(webm) + trace(zip) + observation.json.

const SLOW_DELAY_MS = 1500
// 1.5초 응답이 끝나기 전에 다음 조건을 밀어넣어야 "이전 요청이 늦게 끝나는" 상황이 재현된다.
const RAPID_CHANGE_INTERVAL_MS = 300
const SETTLE_MS = 5000

// 스켈레톤도 .week05-grid를 쓰므로 실제 결과만 고른다.
const REAL_GRID = '.week05-grid:not([aria-hidden="true"])'

const conditionCases = [
  {
    name: '검색',
    parameter: 'q',
    value: 'FRAME',
    expectedIds: ['p24'],
  },
  {
    name: '카테고리',
    parameter: 'category',
    value: 'fashion',
    expectedIds: ['p6', 'p27', 'p7', 'p9', 'p8', 'p10'],
  },
  {
    name: '정렬',
    parameter: 'sort',
    value: 'price-asc',
    expectedIds: [
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
    ],
  },
  {
    name: '페이지',
    parameter: 'page',
    value: '2',
    expectedIds: [
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
    ],
  },
] as const

test.describe('목록 화면 전환 관측 (scenario=slow)', () => {
  for (const conditionCase of conditionCases) {
    test(`${conditionCase.name} 조건은 URL·GET·최종 결과가 일치한다`, async ({
      page,
    }) => {
      const start = Date.now()
      const calls = recordProductApiCalls(page, () => Date.now() - start)

      await page.goto('/products')
      await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })
      const before = await snapshot(page, '조건 변경 전', Date.now() - start)

      if (conditionCase.parameter === 'q') {
        const searchInput = page.getByRole('textbox', { name: '검색' })
        await searchInput.fill(conditionCase.value)
        await searchInput.press('Enter')
      } else if (conditionCase.parameter === 'category') {
        await page.getByLabel('카테고리').selectOption(conditionCase.value)
      } else if (conditionCase.parameter === 'sort') {
        await page.getByLabel('정렬').selectOption(conditionCase.value)
      } else {
        await page
          .locator('.week05-pagination')
          .getByRole('button', { name: conditionCase.value, exact: true })
          .click()
      }

      await page.waitForTimeout(200)
      const refreshing = await snapshot(
        page,
        '조건 변경 응답 전',
        Date.now() - start,
      )
      await expect(page.locator(REAL_GRID)).toHaveAttribute(
        'aria-busy',
        'false',
        { timeout: SETTLE_MS },
      )
      const settled = await snapshot(page, '조건 변경 완료', Date.now() - start)
      const finalCall = calls.at(-1)

      expect(
        new URL(page.url()).searchParams.get(conditionCase.parameter),
      ).toBe(conditionCase.value)
      expect(
        new URLSearchParams(finalCall?.search).get(conditionCase.parameter),
      ).toBe(conditionCase.value)
      expect(refreshing.listProductIds).toEqual(before.listProductIds)
      expect(refreshing.listAriaBusy).toBe('true')
      expect(settled.listProductIds).toEqual(conditionCase.expectedIds)
    })
  }

  test('1. 최초 진입 — 보여줄 데이터가 없는 상태', async ({ page }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    // 서버 prefetch는 실패시켜 hydration data가 없는 최초 상태를 만들고,
    // 브라우저의 첫 요청만 slow 성공 응답으로 전환한다.
    await page.route('**/api/products**', async (route) => {
      const url = new URL(route.request().url())
      url.searchParams.set('scenario', 'slow')
      await route.continue({ url: url.toString() })
    })

    await page.goto('/products?scenario=error')
    // 응답 전에 무엇이 보이는가 — 이게 "최초 진입" 화면이다.
    const pending = await snapshot(page, 'API 응답 전', t0())
    snapshots.push(pending)

    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })
    const settled = await snapshot(page, 'API 응답 후', t0())
    snapshots.push(settled)

    await saveObservation(info, { calls, snapshots })

    expect(pending.skeletonCardCount).toBe(12)
    expect(pending.listVisible).toBe(false)
    expect(settled.listVisible).toBe(true)
  })

  test('2. 기존 목록 갱신 — 필터(카테고리) 변경', async ({ page }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products')
    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })
    snapshots.push(await snapshot(page, '갱신 전 (목록 있음)', t0()))

    await page.getByLabel('카테고리').selectOption('fashion')
    // 갱신 요청 직후 — 기존 목록이 남는가, 지워지는가?
    await page.waitForTimeout(200)
    const refreshing = await snapshot(page, '갱신 요청 직후', t0())
    snapshots.push(refreshing)

    await page.waitForTimeout(SLOW_DELAY_MS)
    const settled = await snapshot(page, '갱신 완료 후', t0())
    snapshots.push(settled)

    await saveObservation(info, { calls, snapshots })

    expect(refreshing.listVisible).toBe(true)
    expect(refreshing.listAriaBusy).toBe('true')
    expect(settled.listAriaBusy).toBe('false')
  })

  test('3. 기존 목록 갱신 — 페이지 이동', async ({ page }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products')
    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })
    snapshots.push(await snapshot(page, '이동 전 (1페이지)', t0()))

    // getByRole의 name은 기본이 부분 일치라 '2'가 카드 쪽 버튼에도 걸린다.
    // 페이지네이션으로 스코프를 좁히고 exact로 잠근다.
    await page
      .locator('.week05-pagination')
      .getByRole('button', { name: '2', exact: true })
      .click()
    // 관측이 비어 있는 채로 조용히 통과하지 않도록, 이동이 실제로 일어났는지 먼저 잠근다.
    await expect(page).toHaveURL(/[?&]page=2\b/)

    await page.waitForTimeout(200)
    snapshots.push(await snapshot(page, '이동 요청 직후', t0()))

    await page.waitForTimeout(SLOW_DELAY_MS)
    snapshots.push(await snapshot(page, '이동 완료 후', t0()))

    await saveObservation(info, { calls, snapshots })
  })

  test('4. 빠른 연속 변경 — URL 정합성과 취소 관측', async ({ page }, info) => {
    const start = Date.now()
    const t0 = (): number => Date.now() - start
    const calls = recordProductApiCalls(page, t0)
    const snapshots: Snapshot[] = []

    await page.goto('/products')
    await expect(page.locator(REAL_GRID)).toBeVisible({ timeout: SETTLE_MS })

    // 각 응답(1.5초)이 끝나기 전에 다음 조건을 넣어 이전 요청을 "늦게 끝나게" 만든다.
    for (const category of ['casual', 'fashion', 'goods', 'digital']) {
      await page.getByLabel('카테고리').selectOption(category)
      snapshots.push(await snapshot(page, `선택: ${category}`, t0()))
      await page.waitForTimeout(RAPID_CHANGE_INTERVAL_MS)
    }

    // 모든 요청이 끝나고도 화면이 마지막 조건과 일치하는가?
    await page.waitForTimeout(SETTLE_MS)
    const settled = await snapshot(page, '정착 후', t0())
    snapshots.push(settled)

    const finalCategory = new URL(settled.url).searchParams.get('category')
    const aborted = calls.filter((call) => call.failure !== null)

    await saveObservation(info, {
      calls,
      snapshots,
      finalCategory,
      abortedCount: aborted.length,
      abortedDetail: aborted,
    })

    expect(finalCategory).toBe('digital')
    expect(aborted).toHaveLength(3)
    expect(
      aborted.map((call) => ({
        category: new URLSearchParams(call.search).get('category'),
        failure: call.failure,
      })),
    ).toEqual([
      { category: 'casual', failure: 'net::ERR_ABORTED' },
      { category: 'fashion', failure: 'net::ERR_ABORTED' },
      { category: 'goods', failure: 'net::ERR_ABORTED' },
    ])
    expect(calls.at(-1)?.status).toBe(200)
    expect(new URLSearchParams(calls.at(-1)?.search).get('category')).toBe(
      'digital',
    )
    expect(settled.listProductIds).toEqual([
      'p24',
      'p22',
      'p30',
      'p21',
      'p25',
      'p23',
    ])
  })
})
