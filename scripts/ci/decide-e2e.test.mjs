import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decideE2e, decideForEvent } from './decide-e2e.mjs'

describe('E2E 실행 판정', () => {
  it('무해 목록만 바뀌면 생략한다', () => {
    const decision = decideE2e([
      'docs/rfc/week10-ci.md',
      'README.md',
      '.vscode/settings.json',
    ])

    assert.equal(decision.run, false)
    assert.deepEqual(decision.deciding, [])
  })

  it('앞 구현이 놓친 루트 런타임 파일에서 실행한다', () => {
    // 허용 목록 시절 이 셋은 전부 생략 판정을 받았다. Next 런타임이 읽는 파일이다.
    for (const path of ['instrumentation.ts', 'middleware.ts', 'proxy.ts']) {
      const decision = decideE2e([path])

      assert.equal(decision.run, true, `${path}에서 실행해야 한다`)
      assert.deepEqual(decision.deciding, [path])
    }
  })

  it('모르는 확장자도 실행으로 기운다', () => {
    const decision = decideE2e(['deno.jsonc', 'some/new/thing.rs'])

    assert.equal(decision.run, true)
    assert.equal(decision.deciding.length, 2)
  })

  it('무해와 런타임이 섞이면 실행한다', () => {
    const decision = decideE2e(['docs/a.md', 'src/app/layout.tsx'])

    assert.equal(decision.run, true)
    assert.deepEqual(decision.deciding, ['src/app/layout.tsx'])
  })

  it('변경 목록이 비면 실행한다', () => {
    // 목록을 못 읽었을 때 생략하면 조용한 false green이 된다.
    const decision = decideE2e([])

    assert.equal(decision.run, true)
    assert.match(decision.reason, /확인할 수 없어/)
  })

  it('workflow 변경은 무해가 아니다', () => {
    const decision = decideE2e(['.github/workflows/quality.yml'])

    assert.equal(decision.run, true)
  })

  it('이슈 템플릿과 CODEOWNERS는 무해다', () => {
    const decision = decideE2e([
      '.github/ISSUE_TEMPLATE/bug.md',
      '.github/CODEOWNERS',
    ])

    assert.equal(decision.run, false)
  })

  it('판정 근거에 경로를 남긴다', () => {
    // PR 화면에서 왜 돌았는지 알 수 있어야 한다.
    const decision = decideE2e(['src/app/page.tsx'])

    assert.match(decision.reason, /런타임에 닿을 수 있는 변경 1개/)
    assert.deepEqual(decision.deciding, ['src/app/page.tsx'])
  })
})

describe('이벤트별 판정', () => {
  it('merge_group은 조건 없이 실행한다', () => {
    // 조건부 스킵의 최종 방어선이다. 여기가 없으면 스킵한 검증을 다시 도는 지점이 없다.
    const decision = decideForEvent({
      event: 'merge_group',
      draft: false,
      changedPaths: [],
    })

    assert.equal(decision.run, true)
  })

  it('main push도 조건 없이 실행한다', () => {
    const decision = decideForEvent({
      event: 'push',
      draft: false,
      changedPaths: [],
    })

    assert.equal(decision.run, true)
  })

  it('draft PR은 경로와 무관하게 생략한다', () => {
    const decision = decideForEvent({
      event: 'pull_request',
      draft: true,
      changedPaths: ['src/app/page.tsx'],
    })

    assert.equal(decision.run, false)
    assert.match(decision.reason, /merge_group에서 전체를 돈다/)
  })

  it('draft가 아니면 경로로 판정한다', () => {
    const decision = decideForEvent({
      event: 'pull_request',
      draft: false,
      changedPaths: ['src/app/page.tsx'],
    })

    assert.equal(decision.run, true)
    assert.deepEqual(decision.deciding, ['src/app/page.tsx'])
  })
})
