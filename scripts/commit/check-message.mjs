// CLAUDE.md는 "커밋에 Co-Authored-By: Claude 등 AI 서명을 넣지 않는다"로 정해 두었다.
// 문서로만 두는 동안 서명이 붙은 커밋 5개가 실제로 만들어졌다. 참·거짓이 문자열로
// 갈리는 규칙이라 기계에 내린다. 로컬 commit-msg 훅과 CI가 같은 판정을 쓴다.
//
// 이름 기반이라 일부러 좁게 둔다. 사람 공동 작업자의 Co-Authored-By는 정당하므로
// trailer 자체를 막지 않고 알려진 AI 계정과 생성 문구만 거부한다.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const AI_SIGNATURE_PATTERNS = [
  {
    name: 'AI 공동 작성자 trailer',
    pattern:
      /^co-authored-by:.*(claude|copilot|chatgpt|gpt-|codex|gemini|cursor|devin|anthropic|openai)/im,
  },
  { name: 'AI 세션 trailer', pattern: /^(claude|codex|cursor)-session:/im },
  {
    name: 'AI 생성 문구',
    pattern: /generated with \[?(claude|codex|cursor|copilot)/i,
  },
  { name: 'AI 생성 이모지 문구', pattern: /🤖\s*generated with/i },
]

export const findAiSignatures = (message) =>
  AI_SIGNATURE_PATTERNS.filter(({ pattern }) => pattern.test(message)).map(
    ({ name }) => name,
  )

const git = (args) => execFileSync('git', args, { encoding: 'utf8' })

export const readCommitMessages = (range) =>
  git(['log', '--format=%H', range])
    .split('\n')
    .map((line) => line.trim())
    .filter((sha) => sha.length > 0)
    .map((sha) => ({ sha, message: git(['log', '-1', '--format=%B', sha]) }))

const report = (failures) => {
  process.stderr.write(
    `AI 서명이 붙은 커밋 ${failures.length}개를 거부합니다.\n` +
      failures
        .map(
          ({ sha, found }) =>
            `- ${sha === '' ? '작성 중인 메시지' : sha}: ${found.join(', ')}`,
        )
        .join('\n') +
      '\nCLAUDE.md의 커밋 컨벤션에 따라 서명 줄을 지웁니다.\n',
  )
}

const run = (argv) => {
  const rangeIndex = argv.indexOf('--range')

  if (rangeIndex !== -1) {
    const range = argv[rangeIndex + 1]
    const failures = readCommitMessages(range)
      .map((commit) => ({ ...commit, found: findAiSignatures(commit.message) }))
      .filter((commit) => commit.found.length > 0)

    if (failures.length > 0) {
      report(failures)
      process.exitCode = 1
      return
    }

    process.stdout.write(`AI 서명 없음: ${range}\n`)
    return
  }

  const messagePath = argv[0]
  if (!messagePath) {
    process.stderr.write(
      '사용법: check-message.mjs <커밋 메시지 파일> 또는 --range <base>..<head>\n',
    )
    process.exitCode = 1
    return
  }

  const found = findAiSignatures(readFileSync(messagePath, 'utf8'))
  if (found.length > 0) {
    report([{ sha: '', found }])
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
}
