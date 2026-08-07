// Lighthouse 5회를 돌리고 회차별 핵심 값과 Hero 요청 기록만 뽑는다.
// 원본 리포트는 회차당 500KB가 넘어 저장소에 두지 않는다. 보고한 숫자를 기계적으로
// 확인할 수 있는 최소 단위만 남긴다.
//
// MEASURE_LH_RAW_DIR을 주면 새로 돌리지 않고 그 디렉터리의 원본 리포트에서 추출한다.
// 문서에 적은 값과 산출물을 같은 회차로 맞출 때 쓴다.

import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { baseUrl, measuredSha, median, range, writeResult } from './harness.mjs'

const LH_VERSION = process.env.MEASURE_LH_VERSION ?? '12.8.2'
const RUNS = Number(process.env.MEASURE_RUNS ?? 5)
const TARGET = process.env.MEASURE_PATH ?? '/'
const LABEL = process.env.MEASURE_LABEL ?? 'home'
const RAW_DIR = process.env.MEASURE_LH_RAW_DIR

const collect = async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'lh-measure-'))
  const files = []
  for (let index = 1; index <= RUNS; index += 1) {
    const output = join(workDir, `run-${index}.json`)
    execFileSync(
      'npx',
      [
        '--yes',
        `lighthouse@${LH_VERSION}`,
        `${baseUrl()}${TARGET}`,
        '--only-categories=performance',
        '--output=json',
        `--output-path=${output}`,
        // 회차마다 새 프로필을 써야 캐시와 확장이 섞이지 않는다.
        `--chrome-flags=--headless=new --no-sandbox --user-data-dir=${join(workDir, `profile-${index}`)}`,
        '--quiet',
      ],
      { stdio: 'inherit' },
    )
    files.push(output)
  }
  return files
}

const fromRawDir = async () => {
  const names = (await readdir(RAW_DIR)).filter((name) =>
    name.endsWith('.json'),
  )
  return names.sort().map((name) => join(RAW_DIR, name))
}

// Hero만 골라야 한다. _next/image로 넓게 잡으면 첫 상품 카드가 걸려, Hero가 없는 목록
// 화면에서도 값이 나오고 Before의 원본 요청은 빠진다. 파일 이름으로 좁힌다.
const HERO_FILE = 'hero-original.jpg'
const isHeroRequest = (url) =>
  url.includes(HERO_FILE) || decodeURIComponent(url).includes(HERO_FILE)

const extract = (report) => {
  const audits = report.audits
  const hero = audits['network-requests'].details.items.find((item) =>
    isHeroRequest(item.url),
  )
  return {
    lighthouseVersion: report.lighthouseVersion,
    requestedUrl: report.requestedUrl,
    fcp: Math.round(audits['first-contentful-paint'].numericValue),
    lcp: Math.round(audits['largest-contentful-paint'].numericValue),
    cls: Number(audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    tbt: Math.round(audits['total-blocking-time'].numericValue),
    performanceScore: Math.round(report.categories.performance.score * 100),
    lcpElement:
      audits['largest-contentful-paint-element']?.details?.items?.[0]
        ?.items?.[0]?.node?.snippet ?? null,
    heroRequest: hero
      ? {
          url: hero.url.replace(baseUrl(), ''),
          // 원본을 그대로 내려보내면 후보 자체가 없다. 그때는 null이다.
          candidateWidthPx: new URL(hero.url).searchParams.get('w')
            ? Number(new URL(hero.url).searchParams.get('w'))
            : null,
          transferSize: hero.transferSize,
          startTimeMs: Math.round(hero.networkRequestTime),
        }
      : null,
  }
}

const files = RAW_DIR ? await fromRawDir() : await collect()
const runs = []
let settings = null
for (const [index, file] of files.entries()) {
  const report = JSON.parse(await readFile(file, 'utf8'))
  settings ??= report.configSettings
  runs.push({ run: index + 1, ...extract(report) })
}

const summarize = (key) => ({
  median: median(runs.map((entry) => entry[key])),
  range: range(runs.map((entry) => entry[key])),
})

const first = runs[0]
await writeResult(`lighthouse-${LABEL}.json`, {
  measuredSha: measuredSha(),
  conditions: {
    url: first.requestedUrl,
    build: 'production (next build && next start)',
    tool: `Lighthouse ${first.lighthouseVersion} headless`,
    preset: 'mobile 기본 프리셋 412x823, DPR 1.75',
    // 감속 방식은 리포트에서 읽는다. simulate는 Lantern의 추정이고 devtools는 실제 적용이라,
    // 두 값을 같은 표에 넣으면 안 된다.
    throttlingMethod: settings.throttlingMethod,
    cpuThrottle: `${settings.throttling.cpuSlowdownMultiplier}x`,
    networkThrottle: `rttMs ${settings.throttling.rttMs}, throughputKbps ${settings.throttling.throughputKbps}`,
    blockedUrlPatterns: settings.blockedUrlPatterns ?? null,
    profile: '회차마다 새 사용자 프로필',
    runs: runs.length,
  },
  runs,
  summary: {
    fcp: summarize('fcp'),
    lcp: summarize('lcp'),
    cls: summarize('cls'),
    tbt: summarize('tbt'),
    performanceScore: summarize('performanceScore'),
  },
})
