// 조건을 빠르게 바꿨을 때 낡은 요청이 끊기는지, 마지막에 남는 화면이 URL과 맞는지 잰다.
// 취소는 실패가 아니다. 사용자가 스스로 조건을 바꾼 정상 동작이라 오류 UI가 뜨면 안 된다.

import {
  baseUrl,
  measuredSha,
  sleep,
  withPage,
  writeResult,
} from './harness.mjs'

// 1.5초 지연이 있어야 앞선 요청이 아직 떠 있는 동안 다음 조건으로 바꿀 수 있다.
const PATH = '/products?scenario=slow'
const STEPS = Number(process.env.MEASURE_STEPS ?? 3)

const result = await withPage('desktop', async (page) => {
  const requests = []
  const queryOf = (url) => new URL(url).search
  const track = (url, status, error) => {
    if (!url.includes('/api/products')) return
    const pending = [...requests]
      .reverse()
      .find(
        (entry) => entry.query === queryOf(url) && entry.status === 'pending',
      )
    if (!pending) return
    pending.status = status
    if (error) pending.error = error
  }

  page.on('request', (request) => {
    if (!request.url().includes('/api/products')) return
    requests.push({
      order: requests.length + 1,
      query: queryOf(request.url()),
      status: 'pending',
    })
  })
  page.on('requestfinished', (request) => track(request.url(), 'finished'))
  page.on('requestfailed', (request) =>
    track(request.url(), 'CANCELLED', request.failure()?.errorText),
  )

  await page.goto(`${baseUrl()}${PATH}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('article')
  await sleep(400)
  requests.length = 0

  // 정렬은 커스텀 combobox다. 트리거를 열고 옵션을 눌러야 조건이 바뀐다.
  const trigger = page
    .locator('.product-filter-control')
    .filter({ hasText: 'Sort' })
    .locator('button.product-filter-trigger')

  const picked = []
  for (let index = 1; index <= STEPS; index += 1) {
    await trigger.click()
    const options = page.locator('[role="option"]')
    await options.first().waitFor()
    picked.push((await options.nth(index).textContent())?.trim())
    await options.nth(index).click()
    await sleep(120)
  }

  await page.waitForFunction(
    () => !document.body.innerText.includes('Updating…'),
    undefined,
    { timeout: 25_000 },
  )
  await sleep(600)

  const final = await page.evaluate(() => ({
    url: location.search,
    countText: document
      .querySelector('.product-result-count')
      ?.textContent?.trim(),
    noticeText:
      document.querySelector('.product-result-notice')?.textContent?.trim() ||
      '(비어 있음)',
    cardCount: document.querySelectorAll('article').length,
    statusText:
      document.querySelector('[role="status"]')?.textContent?.trim() ||
      '(비어 있음)',
    hasErrorUi: /Could not|Try again/i.test(document.body.innerText),
  }))

  return { picked, requests, final }
})

await writeResult('cancellation.json', {
  measuredSha: measuredSha(),
  conditions: {
    url: `${baseUrl()}${PATH}`,
    build: 'production (next build && next start)',
    viewport: '1280x900 DPR 1',
    cpuThrottle: 'none',
    networkThrottle: 'none',
    action: `정렬을 ${STEPS}번 연속으로 바꾼다. scenario=slow라 응답은 1.5초 뒤에 온다.`,
    note: '완료된 요청의 조건과 최종 URL이 같아야 하고, 오류 UI가 뜨면 안 된다.',
  },
  runs: [result],
})
