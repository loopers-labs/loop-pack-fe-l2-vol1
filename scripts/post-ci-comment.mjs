import { readFile, readdir } from 'node:fs/promises'

/*
 * ci-report/ 아래 섹션 파일들을 모아 PR 대화 화면에 코멘트 하나로 올린다.
 *
 * job summary는 Checks 탭을 눌러 들어가야 보인다. 번들 예산은 continue-on-error라
 * check가 초록불로 남으므로 그것만으로는 초과를 놓친다. 통과 결과도 함께 올려
 * "무엇이 어떻게 통과했는지"를 PR에서 바로 확인할 수 있게 한다.
 *
 * 파일 이름의 숫자 접두사가 코멘트 안의 순서다(10 테스트 · 20 환경 변수 · 30 번들).
 */
const REPORT_DIR = 'ci-report'
const COMMENT_MARKER = '<!-- ci-summary-report -->'

const collectSections = async () => {
  let entries
  try {
    entries = await readdir(REPORT_DIR)
  } catch {
    return []
  }

  const sections = entries.filter((name) => name.endsWith('.md')).sort()
  return Promise.all(sections.map((name) => readFile(`${REPORT_DIR}/${name}`, 'utf8')))
}

const readEventPayload = async () => {
  if (!process.env.GITHUB_EVENT_PATH) return null
  try {
    return JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'))
  } catch {
    return null
  }
}

const upsertComment = async (body) => {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  if (!token || !repo) return 'skipped: 토큰 또는 저장소 정보 없음'

  const event = await readEventPayload()
  const prNumber = event?.pull_request?.number
  if (prNumber === undefined) return 'skipped: pull_request 이벤트가 아님'

  const api = `https://api.github.com/repos/${repo}`
  const headers = {
    'authorization': `Bearer ${token}`,
    'accept': 'application/vnd.github+json',
    'content-type': 'application/json',
  }

  try {
    const listed = await fetch(`${api}/issues/${prNumber}/comments?per_page=100`, { headers })
    if (!listed.ok) return `skipped: 코멘트 조회 실패 (${listed.status})`

    // 같은 PR에 코멘트가 쌓이지 않도록 표식으로 찾아 갱신한다.
    const existing = (await listed.json()).find((comment) =>
      comment.body?.startsWith(COMMENT_MARKER),
    )
    const target = existing
      ? `${api}/issues/comments/${existing.id}`
      : `${api}/issues/${prNumber}/comments`

    const written = await fetch(target, {
      method: existing ? 'PATCH' : 'POST',
      headers,
      body: JSON.stringify({ body: `${COMMENT_MARKER}\n${body}` }),
    })
    if (!written.ok) return `skipped: 코멘트 쓰기 실패 (${written.status})`

    return existing ? '기존 코멘트 갱신' : '새 코멘트 작성'
  } catch (error) {
    // fork PR에서는 GITHUB_TOKEN이 읽기 전용이다. 코멘트 실패가 job을 깨지 않게 한다.
    return `skipped: ${error instanceof Error ? error.message : String(error)}`
  }
}

const main = async () => {
  const sections = await collectSections()

  if (sections.length === 0) {
    process.stdout.write('PR 코멘트: skipped: 모을 섹션이 없음\n')
    return
  }

  const runUrl =
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null

  const body = [
    '# CI 검증 요약',
    '',
    ...sections,
    runUrl ? `\n[전체 로그와 job summary 보기](${runUrl})\n` : '',
  ].join('\n')

  process.stdout.write(`PR 코멘트: ${await upsertComment(body)}\n`)
}

await main()
