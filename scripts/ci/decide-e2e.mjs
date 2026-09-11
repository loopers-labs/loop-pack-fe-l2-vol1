// E2E를 언제 돌릴지 판정한다.
//
// 앞 구현은 허용 목록이었다. src, e2e, scripts, config 같은 경로가 바뀔 때만 실행하고
// 나머지는 생략했다. 그 설계는 fail-open이다. 목록에 없는 경로를 새로 만들면 가장 비싼
// 게이트가 조용히 빠진다. 실제로 루트의 instrumentation.ts, middleware.ts, proxy.ts가
// 전부 생략 판정을 받았다. 셋 다 Next 런타임이 읽는 파일이다.
//
// 그래서 거부 목록으로 뒤집는다. 바뀐 경로가 전부 무해하다고 증명될 때만 생략하고,
// 하나라도 모르는 경로가 있으면 실행한다. 새 경로의 기본값이 "실행"이다.
// 목록에 경로를 추가하는 쪽이 비용이 들게 두는 것이 목적이다.
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// 런타임 동작과 production build 산출물에 닿지 않는 경로다.
// 여기에 무언가를 넣을 때는 "이 파일만 바뀐 PR이 배포돼도 화면이 같은가"로 판단한다.
export const INERT_PATTERNS = [
  /^docs\//,
  /\.md$/,
  /^LICENSE$/,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^\.editorconfig$/,
  /^\.prettierignore$/,
  /^\.vscode\//,
  /^\.idea\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^\.github\/CODEOWNERS$/,
]

const isInert = (path) => INERT_PATTERNS.some((pattern) => pattern.test(path))

export const decideE2e = (changedPaths) => {
  // 변경 목록을 못 읽었을 때 생략하면 조용한 false green이 된다. 실행으로 기운다.
  if (changedPaths.length === 0) {
    return {
      run: true,
      reason: '변경 경로를 확인할 수 없어 실행한다',
      deciding: [],
    }
  }

  const deciding = changedPaths.filter((path) => !isInert(path))

  if (deciding.length === 0) {
    return {
      run: false,
      reason: `무해 목록에만 해당하는 변경 ${changedPaths.length}개라 생략한다`,
      deciding: [],
    }
  }

  return {
    run: true,
    reason: `런타임에 닿을 수 있는 변경 ${deciding.length}개가 있어 실행한다`,
    deciding,
  }
}

export const changedPathsBetween = (base, head) =>
  execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
    encoding: 'utf8',
  })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const argValue = (argv, name) => {
  const index = argv.indexOf(name)
  return index === -1 ? undefined : argv[index + 1]
}

const writeOutput = (decision) => {
  const summary = [
    `## E2E 실행 판정: ${decision.run ? '실행' : '생략'}`,
    '',
    `- 근거: ${decision.reason}`,
    ...(decision.deciding.length > 0
      ? [
          `- 판정에 쓰인 경로 ${decision.deciding.length}개 (최대 10개 표시):`,
          ...decision.deciding.slice(0, 10).map((path) => `  - \`${path}\``),
        ]
      : []),
    '',
  ].join('\n')

  process.stdout.write(`${summary}\n`)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `run_e2e=${decision.run}\n`,
      'utf8',
    )
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8')
  }
}

export const decideForEvent = ({ event, draft, changedPaths }) => {
  // pull_request가 아니면 비교할 base가 없다. main push, merge_group, 수동 실행은
  // 조건 없이 전체를 돈다. merge_group이 조건부 스킵의 최종 방어선이다.
  if (event !== 'pull_request') {
    return {
      run: true,
      reason: `${event ?? '알 수 없는'} 이벤트는 조건 없이 실행한다`,
      deciding: [],
    }
  }

  // draft는 작성 중이라는 신호다. 여기서 아끼는 대신 merge_group에서 한 번 더 돈다.
  // 그래서 이 생략은 깨진 코드가 main에 들어가는 경로를 열지 않는다.
  if (draft === true) {
    return {
      run: false,
      reason: 'draft PR이라 생략한다. merge_group에서 전체를 돈다',
      deciding: [],
    }
  }

  return decideE2e(changedPaths)
}

const run = (argv) => {
  const event = argValue(argv, '--event')

  if (event !== 'pull_request') {
    writeOutput(decideForEvent({ event, draft: false, changedPaths: [] }))
    return
  }

  const draft = argValue(argv, '--draft') === 'true'

  if (draft) {
    writeOutput(decideForEvent({ event, draft, changedPaths: [] }))
    return
  }

  const base = argValue(argv, '--base')
  const head = argValue(argv, '--head')

  if (!base || !head) {
    writeOutput({
      run: true,
      reason: 'base 또는 head SHA가 없어 실행한다',
      deciding: [],
    })
    return
  }

  writeOutput(
    decideForEvent({
      event,
      draft,
      changedPaths: changedPathsBetween(base, head),
    }),
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
}
