// 클릭 한 번이 어떤 카드를 다시 그렸는지 잰다. 렌더 비용은 actualDuration으로,
// 범위는 카드 id와 phase로, 같은 commit인지는 commitTime 그룹으로 읽는다.
// commitTime은 소요 시간이 아니라 commit 시점의 타임스탬프다.
//
// 이 스크립트만으로는 동작하지 않는다. profiling build와 임시 계측이 함께 필요하다.
// 절차는 scripts/measure/README.md에 적어 두었다. 계측은 측정 뒤 반드시 되돌린다.

import {
  baseUrl,
  measuredSha,
  sleep,
  waitForImages,
  withPage,
  writeResult,
} from './harness.mjs'

const PATH = '/performance-lab/inp?pageSize=24'

const result = await withPage(
  'desktop',
  async (page) => {
    await page.goto(`${baseUrl()}${PATH}`, { waitUntil: 'networkidle' })
    await waitForImages(page)
    await sleep(500)

    const instrumented = await page.evaluate(() =>
      Array.isArray(window.__renders),
    )
    if (!instrumented) {
      throw new Error(
        'window.__renders가 없다. profiling build와 <Profiler> 임시 계측을 먼저 적용한다.',
      )
    }

    await page.evaluate(() => {
      window.__renders = []
    })
    await page.locator('article').first().locator('button').first().click()
    await sleep(1500)

    const records = await page.evaluate(() => window.__renders)
    // 같은 commit에 묶인 렌더끼리 봐야 클릭 한 번의 범위를 알 수 있다.
    const commits = new Map()
    for (const record of records) {
      const list = commits.get(record.commitTime) ?? []
      list.push(record)
      commits.set(record.commitTime, list)
    }

    return {
      totalRenderRecords: records.length,
      commitCount: commits.size,
      commits: [...commits.entries()].map(([commitTime, list]) => ({
        commitTime: Math.round(commitTime),
        cardCount: list.length,
        updates: list.filter((entry) => entry.phase === 'update').length,
        mounts: list.filter((entry) => entry.phase === 'mount').length,
        ids: list.map((entry) => entry.id),
        totalActualDuration: Math.round(
          list.reduce((sum, entry) => sum + entry.actualDuration, 0),
        ),
        maxActualDuration: Math.round(
          Math.max(...list.map((entry) => entry.actualDuration)),
        ),
      })),
    }
  },
  { cpuThrottle: 4 },
)

await writeResult('render-scope.json', {
  measuredSha: measuredSha(),
  conditions: {
    url: `${baseUrl()}${PATH}`,
    build: 'profiling build (next build --profile && next start)',
    viewport: '1280x900 DPR 1',
    cpuThrottle: '4x (CDP Emulation.setCPUThrottlingRate)',
    instrumentation:
      '카드마다 <Profiler>를 임시로 감싸 onRender를 window.__renders에 모은다',
    note: 'profiling build의 시간은 일반 build의 상호작용 값과 직접 비교하지 않는다. 범위 확인용이다.',
  },
  runs: [result],
})
