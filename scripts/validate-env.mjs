import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

const PUBLIC_PREFIX = 'NEXT_PUBLIC_'
const SECRET_NAME = /(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|ACCESS_KEY)/i

export const validateAppOrigin = (value) => {
  if (!value) {
    return 'APP_ORIGIN이 없습니다. build와 runtime에 같은 절대 URL을 설정합니다.'
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return 'APP_ORIGIN은 절대 URL이어야 합니다.'
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'APP_ORIGIN은 http 또는 https URL이어야 합니다.'
  }

  return null
}

export const findPublicSecretNames = (environment) =>
  Object.keys(environment)
    .filter((name) => name.startsWith(PUBLIC_PREFIX) && SECRET_NAME.test(name))
    .sort()

export const validateEnvironment = (environment) => {
  const errors = []
  const originError = validateAppOrigin(environment.APP_ORIGIN)

  if (originError) {
    errors.push(originError)
  }

  const publicSecretNames = findPublicSecretNames(environment)
  if (publicSecretNames.length > 0) {
    errors.push(
      `브라우저 번들에 노출될 수 있는 비밀 변수 이름이 있습니다: ${publicSecretNames.join(', ')}`,
    )
  }

  return errors
}

const appendSummary = (errors) => {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    return
  }

  const result = errors.length === 0 ? '통과' : '실패'
  const details =
    errors.length === 0
      ? [
          '| 항목 | 기준 | 결과 |',
          '| --- | --- | --- |',
          '| APP_ORIGIN | 절대 http(s) URL | 통과 |',
          '| 공개 비밀 변수 | 없음 | 통과 |',
        ].join('\n')
      : errors.map((error) => `- ${error}`).join('\n')

  appendFileSync(
    summaryPath,
    `## 환경 변수 검증: ${result}\n\n${details}\n\n`,
    'utf8',
  )
}

const run = () => {
  // next build와 같은 production 환경 파일을 먼저 읽는다. process.env만 보면
  // .env.production.local에 들어간 NEXT_PUBLIC_* 비밀 변수를 놓친다.
  loadEnvConfig(process.cwd(), false)
  const errors = validateEnvironment(process.env)
  appendSummary(errors)

  if (errors.length > 0) {
    process.stderr.write(
      `환경 변수 검증 실패\n${errors.map((error) => `- ${error}`).join('\n')}\n`,
    )
    process.exitCode = 1
    return
  }

  process.stdout.write(
    '환경 변수 검증 통과: APP_ORIGIN과 공개 변수 이름을 확인했습니다.\n',
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
}
