// 측정 스크립트가 공유하는 실행 조건이다. 조건이 흩어지면 회차마다 다른 환경에서 잰
// 값을 같은 표에 넣게 된다. 브라우저 기동, 뷰포트, CPU 감속, 결과 봉투를 여기서만 만든다.

import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

// 측정 대상 주소는 실행할 때 정한다. 포트를 코드에 박으면 다른 환경에서 재현할 수 없다.
export const baseUrl = () =>
  process.env.MEASURE_BASE_URL ?? 'http://127.0.0.1:3000'

// Lighthouse 기본 모바일 프리셋과 같은 화면 조건이다. 두 도구의 값을 나란히 읽으려면
// 뷰포트와 DPR이 같아야 한다.
export const VIEWPORTS = {
  mobile: { width: 412, height: 823, dpr: 1.75 },
  desktop: { width: 1280, height: 900, dpr: 1 },
}

export const OUTPUT_DIR = 'docs/measurements/week-07'

// 측정 대상 커밋이다. 지난 측정을 봉투에 담을 때는 그때의 SHA를 넘겨야 한다.
export const measuredSha = () => process.env.MEASURE_SHA

const gitSha = () => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
  } catch {
    // 저장소 밖에서 실행할 수도 있다. 측정을 막을 이유는 아니다.
    return null
  }
}

export const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * 결과에 측정 조건을 함께 저장한다. 숫자만 남기면 나중에 어떤 환경의 값인지 알 수 없다.
 *
 * measuredSha는 반드시 받는다. 스크립트를 돌린 worktree의 HEAD를 그대로 쓰면, 예전에 잰
 * Before 값에 오늘의 SHA가 붙어 어느 코드의 값인지 거짓으로 말하게 된다.
 * extractorSha는 그 값을 봉투에 담은 시점의 HEAD라 서로 다른 정보다.
 */
export const writeResult = async (
  fileName,
  { measuredSha, conditions, runs, summary },
) => {
  if (!measuredSha) {
    throw new Error(
      'measuredSha가 없다. 측정 대상 커밋을 MEASURE_SHA로 넘긴다.',
    )
  }
  const path = join(OUTPUT_DIR, fileName)
  await mkdir(dirname(path), { recursive: true })
  const body = {
    measuredSha,
    extractorSha: gitSha(),
    conditions,
    runs,
    ...(summary ? { summary } : {}),
  }
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`)
  process.stdout.write(`${path}\n`)
  return body
}

/**
 * 뷰포트 하나로 페이지를 열고 콜백에 넘긴다. cpuThrottle을 주면 CDP로 감속을 건다.
 */
export const withPage = async (viewportName, run, options = {}) => {
  const viewport = VIEWPORTS[viewportName]
  if (!viewport) throw new Error(`알 수 없는 뷰포트: ${viewportName}`)

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.dpr,
      ...(options.contextOptions ?? {}),
    })
    const page = await context.newPage()
    if (options.cpuThrottle) {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', {
        rate: options.cpuThrottle,
      })
    }
    return await run(page, viewport)
  } finally {
    await browser.close()
  }
}

/** 이미지까지 다 도착한 뒤에 재야 한다. 로딩 중 값은 회차마다 흔들린다. */
export const waitForImages = (page) =>
  page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete),
    undefined,
    { timeout: 30_000 },
  )

export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export const range = (values) => [Math.min(...values), Math.max(...values)]
