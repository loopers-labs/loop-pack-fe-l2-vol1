import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  compareWithBaseline,
  evaluateRouteBudgets,
  findUnregisteredRoutes,
} from './route-bundle.mjs'

const checkerPath = fileURLToPath(
  new URL('./route-bundle.mjs', import.meta.url),
)

describe('라우트 번들 예산', () => {
  it('예산 이하인 라우트를 통과시킨다', () => {
    const [result] = evaluateRouteBudgets(
      [{ route: '/', firstLoadUncompressedJsBytes: 99 }],
      { '/': 100 },
    )

    assert.deepEqual(result, {
      route: '/',
      budget: 100,
      actual: 99,
      delta: -1,
      passed: true,
    })
  })

  it('예산을 넘긴 라우트와 초과량을 반환한다', () => {
    const [result] = evaluateRouteBudgets(
      [{ route: '/products', firstLoadUncompressedJsBytes: 125 }],
      { '/products': 100 },
    )

    assert.equal(result.passed, false)
    assert.equal(result.delta, 25)
  })

  it('필수 라우트 측정값이 없으면 실패한다', () => {
    const [result] = evaluateRouteBudgets([], { '/': 100 })

    assert.deepEqual(result, {
      route: '/',
      budget: 100,
      actual: null,
      delta: null,
      passed: false,
    })
  })

  it('CLI는 예산 초과량을 출력하고 종료 코드 1을 반환한다', () => {
    const fixtureDir = mkdtempSync(join(tmpdir(), 'week10-size-'))
    const statsPath = join(fixtureDir, 'route-bundle-stats.json')

    try {
      writeFileSync(
        statsPath,
        JSON.stringify([
          { route: '/', firstLoadUncompressedJsBytes: 700_000 },
          { route: '/products', firstLoadUncompressedJsBytes: 619_069 },
          { route: '/login', firstLoadUncompressedJsBytes: 576_958 },
          { route: '/orders', firstLoadUncompressedJsBytes: 583_526 },
          { route: '/orders/new', firstLoadUncompressedJsBytes: 577_350 },
        ]),
        'utf8',
      )

      const result = spawnSync(process.execPath, [checkerPath], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_STEP_SUMMARY: '',
          ROUTE_BUNDLE_STATS_PATH: statsPath,
        },
      })

      assert.equal(result.status, 1)
      assert.match(result.stderr, /\/ 683\.6 KiB/)
      assert.match(result.stderr, /65\.6 KiB 초과/)
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true })
    }
  })
})

describe('예산 미등록 라우트', () => {
  it('예산표와 제외 목록 어디에도 없는 라우트를 찾는다', () => {
    const unregistered = findUnregisteredRoutes(
      [
        { route: '/', firstLoadUncompressedJsBytes: 1 },
        { route: '/checkout', firstLoadUncompressedJsBytes: 5_000_000 },
      ],
      { '/': 100 },
      {},
    )

    assert.deepEqual(unregistered, ['/checkout'])
  })

  it('제외 목록에 이유와 함께 등록된 라우트는 통과시킨다', () => {
    const unregistered = findUnregisteredRoutes(
      [{ route: '/playground', firstLoadUncompressedJsBytes: 5_000_000 }],
      { '/': 100 },
      { '/playground': '제품 표면이 아니다.' },
    )

    assert.deepEqual(unregistered, [])
  })

  it('CLI는 미등록 라우트를 실패로 보고한다', () => {
    // 라우트를 새로 만드는 것만으로 예산 게이트를 빠져나가는 경로를 막는다.
    const fixtureDir = mkdtempSync(join(tmpdir(), 'week10-size-'))
    const statsPath = join(fixtureDir, 'route-bundle-stats.json')

    try {
      writeFileSync(
        statsPath,
        JSON.stringify([
          { route: '/', firstLoadUncompressedJsBytes: 602_487 },
          { route: '/products', firstLoadUncompressedJsBytes: 619_069 },
          { route: '/login', firstLoadUncompressedJsBytes: 576_958 },
          { route: '/orders', firstLoadUncompressedJsBytes: 583_526 },
          { route: '/orders/new', firstLoadUncompressedJsBytes: 577_350 },
          { route: '/checkout', firstLoadUncompressedJsBytes: 5_000_000 },
        ]),
        'utf8',
      )

      const result = spawnSync(process.execPath, [checkerPath], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_STEP_SUMMARY: '',
          ROUTE_BUNDLE_STATS_PATH: statsPath,
        },
      })

      assert.equal(result.status, 1)
      assert.match(result.stderr, /예산 미등록 라우트: \/checkout/)
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true })
    }
  })
})

describe('기준선 대비 증감', () => {
  it('허용 폭 안의 차이는 통과시킨다', () => {
    // toolchain 비결정성만 흡수한다. 기능 추가는 KB 단위라 이 폭에 숨지 않는다.
    const drifted = compareWithBaseline(
      [{ route: '/', firstLoadUncompressedJsBytes: 602_600 }],
      { '/': 602_487 },
    )

    assert.deepEqual(drifted, [])
  })

  it('예산 안에서 늘어난 증가도 잡는다', () => {
    // 예산은 상한만 본다. 618 KiB 아래에서 8 KiB가 늘어도 예산 게이트는 통과한다.
    const drifted = compareWithBaseline(
      [{ route: '/', firstLoadUncompressedJsBytes: 610_687 }],
      { '/': 602_487 },
    )

    assert.equal(drifted.length, 1)
    assert.equal(drifted[0].drift, 8_200)
  })

  it('줄어든 것도 기준선 갱신 대상이다', () => {
    const drifted = compareWithBaseline(
      [{ route: '/', firstLoadUncompressedJsBytes: 580_000 }],
      { '/': 602_487 },
    )

    assert.equal(drifted.length, 1)
    assert.ok(drifted[0].drift < 0)
  })

  it('기준선에 있는 라우트가 사라지면 잡는다', () => {
    const drifted = compareWithBaseline([], { '/orders': 583_526 })

    assert.equal(drifted.length, 1)
    assert.equal(drifted[0].actual, null)
  })

  it('CLI는 기준선 증감을 실패로 보고한다', () => {
    const fixtureDir = mkdtempSync(join(tmpdir(), 'week10-size-'))
    const statsPath = join(fixtureDir, 'route-bundle-stats.json')
    const baselinePath = join(fixtureDir, 'baseline.json')

    try {
      writeFileSync(
        statsPath,
        JSON.stringify([
          { route: '/', firstLoadUncompressedJsBytes: 610_687 },
          { route: '/products', firstLoadUncompressedJsBytes: 619_069 },
          { route: '/login', firstLoadUncompressedJsBytes: 576_958 },
          { route: '/orders', firstLoadUncompressedJsBytes: 583_526 },
          { route: '/orders/new', firstLoadUncompressedJsBytes: 577_350 },
        ]),
        'utf8',
      )
      writeFileSync(baselinePath, JSON.stringify({ '/': 602_487 }), 'utf8')

      const result = spawnSync(process.execPath, [checkerPath], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_STEP_SUMMARY: '',
          ROUTE_BUNDLE_STATS_PATH: statsPath,
          ROUTE_BUNDLE_BASELINE_PATH: baselinePath,
        },
      })

      assert.equal(result.status, 1)
      // 상세는 stdout과 summary에, stderr에는 실패 이유 한 줄만 남긴다.
      // 같은 블록을 둘 다에 쓰면 CI 로그에 두 번 찍혀 두 건으로 읽힌다.
      assert.match(result.stdout, /기준선과 다른 라우트 1개/)
      assert.match(result.stdout, /\+8200 B/)
      assert.match(result.stderr, /번들 기준선 불일치: \/ \+8200 B/)
      assert.doesNotMatch(result.stderr, /기준선과 다른 라우트/)
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true })
    }
  })

  it('기준선 파일이 없으면 실패한다', () => {
    const fixtureDir = mkdtempSync(join(tmpdir(), 'week10-size-'))
    const statsPath = join(fixtureDir, 'route-bundle-stats.json')

    try {
      writeFileSync(
        statsPath,
        JSON.stringify([{ route: '/', firstLoadUncompressedJsBytes: 1 }]),
        'utf8',
      )

      const result = spawnSync(process.execPath, [checkerPath], {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_STEP_SUMMARY: '',
          ROUTE_BUNDLE_STATS_PATH: statsPath,
          ROUTE_BUNDLE_BASELINE_PATH: join(fixtureDir, 'missing.json'),
        },
      })

      assert.equal(result.status, 1)
      assert.match(result.stderr, /기준선 파일이 없습니다/)
      assert.match(result.stdout, /기준선 파일이 없습니다/)
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true })
    }
  })
})
