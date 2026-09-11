import { readFileSync, appendFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const KIB = 1024

// 예산은 상한만 본다. 예산 안에서 조금씩 차오르는 증가는 잡지 못한다.
// 그래서 측정값 자체를 커밋된 기준선과 맞춘다. 번들이 늘면 기준선 diff가 같은 PR에
// 올라오고, 리뷰가 "무엇이 몇 바이트 늘렸나"를 숫자로 본다.
export const BASELINE_PATH =
  'docs/measurements/week-10/route-bundle-baseline.json'

// toolchain 비결정성을 흡수할 만큼만 둔다. 기능 추가는 KB 단위라 이 폭에 숨지 않는다.
export const BASELINE_TOLERANCE_BYTES = 512

// Next 16.2.10이 .next/diagnostics/route-bundle-stats.json에 기록하는
// 라우트별 firstLoadUncompressedJsBytes를 사용한다. Lighthouse의 네트워크
// transferSize와 단위가 다르므로 두 값을 직접 비교하지 않는다.
// 임계값은 모두 같은 정책으로 정한다 — 같은 Next build에서 3회 측정해 편차가 0인
// 현재값에 5%를 더하고 KiB로 올림한다. `/`와 `/products`는 7주차 측정 대상이라
// week10-ci.md E절에 추이가 있고, 나머지 제품 화면은 10주차 현재값이 출발점이다.
export const ROUTE_BUDGETS = {
  '/': 618 * KIB,
  '/products': 635 * KIB,
  '/login': 592 * KIB,
  '/orders': 599 * KIB,
  '/orders/new': 593 * KIB,
}

// 예산을 두지 않기로 한 라우트와 그 이유다. 예산표에 없는 라우트를 조용히 넘기면
// 라우트를 새로 만드는 것만으로 게이트를 빠져나간다. 둘 중 한 곳에 이름이 있어야 통과한다.
export const UNBUDGETED_ROUTES = {
  '/_not-found': 'Next 내부 라우트다. 제품 화면이 아니고 공통 청크만 싣는다.',
  '/playground': '컴포넌트 확인용 실습 화면이다. 제품 표면이 아니다.',
  '/performance-lab/inp':
    '7주차 INP 측정 실습 화면이다. 측정 대상을 일부러 무겁게 두는 자리다.',
}

export const compareWithBaseline = (
  stats,
  baseline,
  tolerance = BASELINE_TOLERANCE_BYTES,
) => {
  const measured = new Map(
    stats.map((entry) => [entry.route, entry.firstLoadUncompressedJsBytes]),
  )

  return Object.entries(baseline)
    .map(([route, expected]) => {
      const actual = measured.get(route)
      if (!Number.isFinite(actual)) {
        return { route, expected, actual: null, drift: null }
      }
      const drift = actual - expected
      return Math.abs(drift) <= tolerance
        ? null
        : { route, expected, actual, drift }
    })
    .filter((entry) => entry !== null)
}

export const findUnregisteredRoutes = (
  stats,
  budgets = ROUTE_BUDGETS,
  exempt = UNBUDGETED_ROUTES,
) =>
  stats
    .map((entry) => entry.route)
    .filter((route) => !(route in budgets) && !(route in exempt))
    .sort()

const formatKiB = (bytes) => `${(bytes / KIB).toFixed(1)} KiB`

export const evaluateRouteBudgets = (stats, budgets = ROUTE_BUDGETS) => {
  const byRoute = new Map(
    stats.map((entry) => [entry.route, entry.firstLoadUncompressedJsBytes]),
  )

  return Object.entries(budgets).map(([route, budget]) => {
    const actual = byRoute.get(route)
    if (!Number.isFinite(actual)) {
      return { route, budget, actual: null, delta: null, passed: false }
    }

    return {
      route,
      budget,
      actual,
      delta: actual - budget,
      passed: actual <= budget,
    }
  })
}

const renderTable = (results) => {
  const rows = results.map((result) => {
    const actual =
      result.actual === null ? '측정값 없음' : formatKiB(result.actual)
    const delta =
      result.delta === null
        ? '-'
        : `${result.delta > 0 ? '+' : ''}${formatKiB(result.delta)}`
    return `| ${result.route} | ${actual} | ${formatKiB(result.budget)} | ${delta} | ${result.passed ? '통과' : '실패'} |`
  })

  return [
    '| 라우트 | 현재 비압축 JS | 예산 | 차이 | 결과 |',
    '| --- | ---: | ---: | ---: | --- |',
    ...rows,
  ].join('\n')
}

const readStats = (statsPath) => {
  const parsed = JSON.parse(readFileSync(statsPath, 'utf8'))
  if (!Array.isArray(parsed)) {
    throw new Error(`${statsPath}의 최상위 값이 배열이 아닙니다.`)
  }
  return parsed
}

const readBaseline = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

const writeBaseline = (path, stats) => {
  const entries = Object.fromEntries(
    stats
      .map((entry) => [entry.route, entry.firstLoadUncompressedJsBytes])
      .sort(([left], [right]) => left.localeCompare(right)),
  )
  writeFileSync(path, `${JSON.stringify(entries, null, 2)}\n`, 'utf8')
  process.stdout.write(`기준선을 갱신했습니다: ${path}\n`)
}

const renderBaselineReport = (baselinePath, baseline, drifted) => {
  if (baseline === null) {
    return (
      `\n기준선 파일이 없습니다: ${baselinePath}\n` +
      '`pnpm size:baseline`으로 만들고 커밋합니다.\n'
    )
  }

  if (drifted.length === 0) {
    return ''
  }

  const lines = drifted.map(({ route, expected, actual, drift }) =>
    actual === null
      ? `- ${route}: 측정값 없음 (기준선 ${expected} B)`
      : `- ${route}: ${actual} B (기준선 ${expected} B, ${drift > 0 ? '+' : ''}${drift} B)`,
  )

  return (
    `\n기준선과 다른 라우트 ${drifted.length}개\n${lines.join('\n')}\n` +
    '번들이 바뀐 이유를 PR에 적고 `pnpm size:baseline`으로 기준선을 갱신합니다.\n'
  )
}

const run = (argv = []) => {
  const statsPath =
    process.env.ROUTE_BUNDLE_STATS_PATH ??
    '.next/diagnostics/route-bundle-stats.json'
  const stats = readStats(statsPath)

  const baselinePath = process.env.ROUTE_BUNDLE_BASELINE_PATH ?? BASELINE_PATH

  if (argv.includes('--update-baseline')) {
    writeBaseline(baselinePath, stats)
    return
  }
  const results = evaluateRouteBudgets(stats)
  const unregistered = findUnregisteredRoutes(stats)
  const table = renderTable(results)
  const failed = results.filter((result) => !result.passed)

  const unregisteredReport =
    unregistered.length === 0
      ? ''
      : `\n예산 미등록 라우트: ${unregistered.join(', ')}\n` +
        'ROUTE_BUDGETS에 임계값을 넣거나 UNBUDGETED_ROUTES에 이유와 함께 넣습니다.\n'

  const baseline = readBaseline(baselinePath)
  const drifted = baseline === null ? [] : compareWithBaseline(stats, baseline)
  const baselineReport = renderBaselineReport(baselinePath, baseline, drifted)

  process.stdout.write(`${table}\n${unregisteredReport}${baselineReport}`)

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## 라우트 번들 예산\n\n측정 단위: Next 16.2.10의 최초 로드 비압축 JavaScript\n\n${table}\n${unregisteredReport}${baselineReport}\n`,
      'utf8',
    )
  }

  if (baseline === null || drifted.length > 0) {
    // 상세는 이미 stdout과 summary에 있다. 같은 블록을 stderr에 다시 쓰면 로그에
    // 두 번 찍혀 읽는 사람이 두 건으로 오인한다. 실패 이유만 한 줄로 남긴다.
    process.stderr.write(
      baseline === null
        ? `기준선 파일이 없습니다: ${baselinePath}\n`
        : `번들 기준선 불일치: ${drifted
            .map(({ route, drift }) =>
              drift === null
                ? `${route} 측정값 없음`
                : `${route} ${drift > 0 ? '+' : ''}${drift} B`,
            )
            .join(', ')}\n`,
    )
    process.exitCode = 1
  }

  if (unregistered.length > 0) {
    process.stderr.write(
      `예산 미등록 라우트: ${unregistered.join(', ')}\n` +
        'ROUTE_BUDGETS에 임계값을 넣거나 UNBUDGETED_ROUTES에 이유와 함께 넣습니다.\n',
    )
    process.exitCode = 1
  }

  if (failed.length > 0) {
    process.stderr.write(
      `번들 예산 초과: ${failed
        .map((result) =>
          result.actual === null
            ? `${result.route} 측정값 없음`
            : `${result.route} ${formatKiB(result.actual)} / 예산 ${formatKiB(result.budget)} (${formatKiB(result.delta)} 초과)`,
        )
        .join(', ')}\n`,
    )
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
}
