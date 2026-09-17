import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { findAiSignatures } from './check-message.mjs'

const checkerPath = fileURLToPath(
  new URL('./check-message.mjs', import.meta.url),
)

describe('AI 서명 검출', () => {
  it('Claude 공동 작성자 trailer를 잡는다', () => {
    const found = findAiSignatures(
      'fix: 무언가를 고친다\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>\n',
    )

    assert.deepEqual(found, ['AI 공동 작성자 trailer'])
  })

  it('세션 trailer를 잡는다', () => {
    const found = findAiSignatures(
      'docs: 기록한다\n\nClaude-Session: https://claude.ai/code/session_x\n',
    )

    assert.deepEqual(found, ['AI 세션 trailer'])
  })

  it('생성 문구와 이모지 문구를 잡는다', () => {
    assert.deepEqual(findAiSignatures('🤖 Generated with [Claude Code]'), [
      'AI 생성 문구',
      'AI 생성 이모지 문구',
    ])
  })

  it('사람 공동 작성자는 통과시킨다', () => {
    // trailer 자체를 막으면 정당한 페어 프로그래밍 기록까지 막힌다.
    const found = findAiSignatures(
      'feat: 함께 만든다\n\nCo-authored-by: Jiwon Son <jiwon@example.com>\n',
    )

    assert.deepEqual(found, [])
  })

  it('본문에 쓴 도구 이름은 서명이 아니다', () => {
    const found = findAiSignatures(
      'docs: AI 리뷰 기록을 남긴다\n\n- 무엇: Codex CLI로 diff를 리뷰한 결과를 적었다.\n',
    )

    assert.deepEqual(found, [])
  })
})

describe('commit-msg 훅 경로', () => {
  it('서명이 있으면 종료 코드 1과 이유를 낸다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'week10-commitmsg-'))
    const messagePath = join(dir, 'COMMIT_EDITMSG')

    try {
      writeFileSync(
        messagePath,
        'fix: 고친다\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n',
        'utf8',
      )

      const result = spawnSync(process.execPath, [checkerPath, messagePath], {
        encoding: 'utf8',
      })

      assert.equal(result.status, 1)
      assert.match(result.stderr, /AI 공동 작성자 trailer/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('서명이 없으면 통과시킨다', () => {
    const dir = mkdtempSync(join(tmpdir(), 'week10-commitmsg-'))
    const messagePath = join(dir, 'COMMIT_EDITMSG')

    try {
      writeFileSync(messagePath, 'fix: 고친다\n\n- 왜: 필요해서\n', 'utf8')

      const result = spawnSync(process.execPath, [checkerPath, messagePath], {
        encoding: 'utf8',
      })

      assert.equal(result.status, 0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
