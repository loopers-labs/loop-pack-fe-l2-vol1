import { appendFile, mkdir, writeFile } from 'node:fs/promises'

/*
 * build 전에 환경 변수 계약을 검사한다. 아래 목록이 이 프로젝트의 설정 계약이다.
 * 실패 메시지에 값을 싣지 않는다. 리포트가 secret 유출 경로가 되면 게이트를 만든 의미가 없다.
 */

const REPORT_DIR = 'ci-report'

// 서버 렌더링이 API를 호출할 절대 origin. 없으면 app/layout.tsx의 metadataBase가 빌드 중에 죽는다.
const REQUIRED_URL_VARS = ['APP_ORIGIN']

// 브라우저에 나가면 안 되는 값들. 이유는 src/shared/api/get-api-base-url.ts 주석 참고.
const SERVER_ONLY_VARS = ['APP_ORIGIN', 'AUTH_SESSION_SECRET']

// Vercel은 배포마다 URL이 달라 VERCEL_URL이 기본값을 맡는다. 그래서 여기서만 APP_ORIGIN이 선택이다.
const isOnVercel = process.env.VERCEL === '1'

const checkRequiredUrl = (name) => {
  const raw = process.env[name]

  if (raw === undefined || raw.trim() === '') {
    if (isOnVercel && process.env.VERCEL_URL) return null

    return [
      `${name}이(가) 없습니다. 서버 렌더링이 API를 호출할 절대 origin이 필요합니다.`,
      `로컬에서는 .env.local에 ${name}=http://localhost:3000 을 추가하세요.`,
    ].join(' ')
  }

  const value = raw.trim()
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    // 값을 그대로 싣지 않는다. 무엇이 잘못됐는지만 말한다.
    return `${name}이(가) 절대 URL이 아닙니다. http:// 또는 https:// 로 시작하는 origin이어야 합니다.`
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `${name}의 프로토콜이 http/https가 아닙니다.`
  }

  if (
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    return `${name}은(는) 경로·쿼리·해시·인증 정보가 없는 순수 origin이어야 합니다.`
  }

  return null
}

const checkNotExposed = (name) => {
  const exposed = `NEXT_PUBLIC_${name}`

  if (process.env[exposed] === undefined) return null

  return [
    `${exposed}이(가) 설정돼 있습니다. ${name}은(는) 서버 전용 값입니다.`,
    'NEXT_PUBLIC_ 접두사가 붙으면 빌드 시점에 클라이언트 번들로 값이 새어 나갑니다.',
  ].join(' ')
}

/*
 * Preview의 APP_ORIGIN이 다른 환경을 가리키면 Preview의 SSR이 그 환경의 API를 호출한다.
 * 유효한 URL이라 형식 검사로는 안 걸린다. Production은 커스텀 도메인이 정상이라 제외한다.
 */
const checkSelfReference = () => {
  if (!isOnVercel || process.env.VERCEL_ENV !== 'preview') return null

  const raw = process.env.APP_ORIGIN
  const deploymentUrl = process.env.VERCEL_URL
  if (!raw?.trim() || !deploymentUrl) return null

  let host
  try {
    host = new URL(raw).host
  } catch {
    // 형식 오류는 checkRequiredUrl이 이미 보고한다.
    return null
  }

  if (host === deploymentUrl) return null

  return [
    'APP_ORIGIN이 이 Preview 배포가 아닌 다른 환경을 가리킵니다.',
    'Preview의 서버 렌더링이 그 환경의 API를 호출하게 되어 테스트 데이터가 섞입니다.',
    'Preview에서는 APP_ORIGIN을 비워 VERCEL_URL이 쓰이게 하세요.',
  ].join(' ')
}

const collectFailures = () => [
  ...REQUIRED_URL_VARS.map(checkRequiredUrl),
  ...SERVER_ONLY_VARS.map(checkNotExposed),
  checkSelfReference(),
]

const buildSummary = (failures) => {
  if (failures.length === 0) {
    const checked = [...new Set([...REQUIRED_URL_VARS, ...SERVER_ONLY_VARS])].join(', ')
    return `## ✅ 환경 변수 검증 통과\n\n검사 대상: \`${checked}\`\n\n`
  }

  return [
    '## ❌ 환경 변수 검증 실패',
    '',
    ...failures.map((reason) => `- ${reason}`),
    '',
    '값은 보안상 출력하지 않습니다. 설정 계약은 `scripts/validate-env.mjs`에 있습니다.',
    '',
  ].join('\n')
}

const main = async () => {
  const failures = collectFailures().filter((reason) => reason !== null)
  const summary = buildSummary(failures)

  process.stdout.write(summary)

  // 실패로 종료하기 전에 요약을 먼저 남긴다. 리포트가 필요한 순간이 바로 실패했을 때다.
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
  }

  // PR 코멘트를 합치는 스크립트가 읽어간다. step마다 GITHUB_STEP_SUMMARY 파일이
  // 따로라 다른 step의 요약을 읽을 수 없으므로, 공유 디렉터리에 각자 남긴다.
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(`${REPORT_DIR}/20-env.md`, summary)

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

await main()
