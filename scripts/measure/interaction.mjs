// 찜 클릭 한 번의 상호작용 지연을 세 구간으로 나눠 잰다.
// 현장 INP가 아니라 INP에 영향을 주는 지연 시간이다. 같은 interactionId의 엔트리를 묶어
// 그중 가장 긴 duration을 그 상호작용의 값으로 쓴다.

import { readFile } from 'node:fs/promises'
import {
  baseUrl,
  measuredSha,
  median,
  range,
  sleep,
  waitForImages,
  withPage,
  writeResult,
} from './harness.mjs'

const PATH = '/performance-lab/inp?pageSize=24'
const RUNS = Number(process.env.MEASURE_RUNS ?? 5)
const LABEL = process.env.MEASURE_LABEL ?? 'interaction'
// 제출 당시 잰 원값을 그대로 봉투에 담을 때 쓴다. 다시 재면 같은 조건이어도 회차 값이
// 달라지므로, 문서가 보고한 수치를 확인하려면 그때의 값을 넣어야 한다.
const RAW_FILE = process.env.MEASURE_RUNS_FILE

const observe = () => {
  window.__interactions = []
  // durationThreshold를 명시하지 않으면 개선 후 짧아진 엔트리가 빠져 비교가 끊긴다.
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.interactionId) continue
      window.__interactions.push({
        interactionId: entry.interactionId,
        name: entry.name,
        startTime: entry.startTime,
        processingStart: entry.processingStart,
        processingEnd: entry.processingEnd,
        duration: entry.duration,
      })
    }
  }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
}

const runOnce = (index) =>
  withPage(
    'desktop',
    async (page) => {
      await page.addInitScript(observe)
      await page.goto(`${baseUrl()}${PATH}`, { waitUntil: 'networkidle' })
      await waitForImages(page)
      await sleep(500)

      const card = page.locator('article').first()
      const before = await card
        .locator('button')
        .first()
        .getAttribute('aria-pressed')
      await card.locator('button').first().click()
      await sleep(1200)
      const after = await card
        .locator('button')
        .first()
        .getAttribute('aria-pressed')

      const entries = await page.evaluate(() => window.__interactions)
      // 한 번의 클릭은 pointerdown, pointerup, click 엔트리로 나뉜다. 같은 상호작용이므로
      // interactionId로 묶고 가장 긴 것을 대표값으로 쓴다.
      const grouped = new Map()
      for (const entry of entries) {
        const list = grouped.get(entry.interactionId) ?? []
        list.push(entry)
        grouped.set(entry.interactionId, list)
      }
      const longest = [...grouped.values()]
        .map((list) =>
          list.reduce((a, b) => (a.duration >= b.duration ? a : b)),
        )
        .sort((a, b) => b.duration - a.duration)[0]

      // 카드 수와 화면 계산과 즉시 피드백이 유지됐는지 같은 회차에서 확인한다.
      const constraints = await page.evaluate(() => ({
        cards: document.querySelectorAll('article').length,
        checksums: Array.from(document.querySelectorAll('article p')).filter(
          (node) => node.textContent?.includes('화면 계산'),
        ).length,
      }))

      return {
        run: index,
        pressedBefore: before,
        pressedAfter: after,
        events: [...grouped.values()].flat().map((entry) => entry.name),
        inputDelay: Math.round(longest.processingStart - longest.startTime),
        processing: Math.round(longest.processingEnd - longest.processingStart),
        presentation: Math.round(
          longest.duration - (longest.processingEnd - longest.startTime),
        ),
        duration: Math.round(longest.duration),
        constraints,
      }
    },
    { cpuThrottle: 4 },
  )

let runs = []
if (RAW_FILE) {
  runs = JSON.parse(await readFile(RAW_FILE, 'utf8')).runs
} else {
  for (let index = 1; index <= RUNS; index += 1) {
    runs.push(await runOnce(index))
  }
}

const summarize = (key) => ({
  median: median(runs.map((entry) => entry[key])),
  range: range(runs.map((entry) => entry[key])),
})

await writeResult(`${LABEL}.json`, {
  measuredSha: measuredSha(),
  conditions: {
    url: `${baseUrl()}${PATH}`,
    build: 'production (next build && next start)',
    viewport: '1280x900 DPR 1',
    cpuThrottle: '4x (CDP Emulation.setCPUThrottlingRate)',
    networkThrottle: 'none',
    startState: '회차마다 새 문서, 같은 상품이 찜되지 않은 상태',
    entryFilter: 'PerformanceObserver type=event, durationThreshold=16',
    grouping: 'interactionId로 묶고 가장 긴 duration을 사용',
    note: '현장 INP가 아니라 INP에 영향을 주는 상호작용 지연 시간이다.',
    source: RAW_FILE
      ? '제출 당시 측정한 원값을 그대로 담았다'
      : '이 스크립트로 새로 측정했다',
  },
  runs,
  summary: {
    inputDelay: summarize('inputDelay'),
    processing: summarize('processing'),
    presentation: summarize('presentation'),
    duration: summarize('duration'),
  },
})
