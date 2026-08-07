import { writeFile } from 'node:fs/promises'
import type { Page, TestInfo } from '@playwright/test'

// 목록 화면 관측 도구. Before/After가 같은 계기로 재게 하려고 스펙 밖으로 뺐다.
//
// 7주차 2단계에서 로딩 UI가 텍스트 한 줄에서 실제 크기의 스켈레톤으로 바뀌었다.
// 스켈레톤도 .week05-grid를 쓰므로 aria-hidden으로 실제 목록과 구분한다.
// (Before 시점에는 스켈레톤이 없었으므로 이 구분이 Before 기록을 바꾸지 않는다.)

export interface ApiCall {
  search: string
  startedAtMs: number
  endedAtMs: number | null
  status: number | null
  failure: string | null
}

export interface Snapshot {
  label: string
  atMs: number
  url: string
  /** 최초 로딩 화면: 텍스트 한 줄(.commerce-status) 또는 스켈레톤 */
  statusText: string | null
  skeletonVisible: boolean
  skeletonCardCount: number
  /** 실제 결과 */
  listVisible: boolean
  listAriaBusy: string | null
  listCardCount: number
  listProductIds: string[]
  totalCountText: string | null
  emptyText: string | null
  /** 갱신 실패 배너 (목록을 유지한 채 뜨는 오류) */
  inlineErrorVisible: boolean
}

export function recordProductApiCalls(page: Page, t0: () => number): ApiCall[] {
  const calls: ApiCall[] = []
  const find = (url: string): ApiCall | undefined =>
    calls.find((call) => call.search === new URL(url).search && !call.endedAtMs)

  page.on('request', (request) => {
    if (!request.url().includes('/api/products')) return
    calls.push({
      search: new URL(request.url()).search,
      startedAtMs: t0(),
      endedAtMs: null,
      status: null,
      failure: null,
    })
  })
  page.on('response', (response) => {
    if (!response.url().includes('/api/products')) return
    const call = find(response.url())
    if (call) {
      call.endedAtMs = t0()
      call.status = response.status()
    }
  })
  page.on('requestfailed', (request) => {
    if (!request.url().includes('/api/products')) return
    const call = find(request.url())
    if (call) {
      call.endedAtMs = t0()
      call.failure = request.failure()?.errorText ?? 'unknown'
    }
  })

  return calls
}

// 스냅샷은 "그 순간" 화면을 찍는 것이라 기다리면 안 된다.
// locator의 textContent()는 요소가 없으면 테스트 타임아웃까지 블록되므로,
// 대기가 전혀 없는 단일 evaluate로 DOM을 한 번에 읽는다.
export async function snapshot(
  page: Page,
  label: string,
  atMs: number,
): Promise<Snapshot> {
  const seen = await page.evaluate(() => {
    const grids = Array.from(document.querySelectorAll('.week05-grid'))
    const skeleton = grids.find(
      (node) => node.getAttribute('aria-hidden') === 'true',
    )
    const list = grids.find(
      (node) => node.getAttribute('aria-hidden') !== 'true',
    )
    const total = Array.from(document.querySelectorAll('p')).find((node) =>
      /^총 \d+개$/.test(node.textContent?.trim() ?? ''),
    )
    return {
      url: window.location.href,
      statusText:
        document.querySelector('.commerce-status')?.textContent?.trim() ?? null,
      skeletonVisible: skeleton !== undefined,
      skeletonCardCount: skeleton?.childElementCount ?? 0,
      listVisible: list !== undefined,
      listAriaBusy: list?.getAttribute('aria-busy') ?? null,
      listCardCount: list?.childElementCount ?? 0,
      listProductIds: Array.from(list?.querySelectorAll('img') ?? []).flatMap(
        (image) => {
          const match = decodeURIComponent(
            image.getAttribute('src') ?? '',
          ).match(/\/images\/products\/(p\d+)\.jpg/)
          return match?.[1] ? [match[1]] : []
        },
      ),
      totalCountText: total?.textContent?.trim() ?? null,
      emptyText:
        document.querySelector('.commerce-empty')?.textContent?.trim() ?? null,
      inlineErrorVisible:
        document.querySelector('.commerce-inline-error') !== null,
    }
  })
  return { label, atMs, ...seen }
}

export async function saveObservation(
  testInfo: TestInfo,
  payload: Record<string, unknown>,
): Promise<void> {
  const path = testInfo.outputPath('observation.json')
  await writeFile(path, JSON.stringify(payload, null, 2), 'utf8')
  await testInfo.attach('observation', {
    path,
    contentType: 'application/json',
  })
}
