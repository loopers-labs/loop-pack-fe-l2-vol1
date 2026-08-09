// server prefetch를 고른 대가를 잰다. 브라우저 조회를 없앤 값과 문서가 커진 값을 함께 남긴다.
// 얻은 것만 적으면 왜 이 경계를 골랐는지 설명할 수 없다.

import {
  baseUrl,
  measuredSha,
  sleep,
  withPage,
  writeResult,
} from './harness.mjs'

const PATHS = ['/', '/products']

const measure = (path) =>
  withPage('desktop', async (page) => {
    const apiRequests = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push(new URL(request.url()).pathname)
      }
    })

    const response = await page.goto(`${baseUrl()}${path}`, {
      waitUntil: 'networkidle',
    })
    const html = await response.text()
    // hydration 뒤 브라우저가 같은 조건을 다시 가져가는지 보려면 조금 더 기다려야 한다.
    await sleep(1500)

    return {
      path,
      documentBytes: Buffer.byteLength(html),
      browserApiRequests: apiRequests,
      hasDehydratedState: /queryKey/.test(html),
    }
  })

const runs = []
for (const path of PATHS) {
  runs.push(await measure(path))
}

await writeResult('hydration-cost.json', {
  measuredSha: measuredSha(),
  conditions: {
    baseUrl: baseUrl(),
    build: 'production (next build && next start)',
    viewport: '1280x900 DPR 1',
    cpuThrottle: 'none',
    networkThrottle: 'none',
    note: 'browserApiRequests가 비어 있으면 서버가 넘긴 결과를 브라우저가 그대로 이어받은 것이다.',
  },
  runs,
})
