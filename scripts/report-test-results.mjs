import { readFile, mkdir, writeFile } from 'node:fs/promises'

/*
 * vitest의 json 리포터 출력을 PR 코멘트용 섹션으로 바꾼다.
 *
 * vitest는 GITHUB_ACTIONS 환경에서 github-actions 리포터를 자동으로 켜 job summary에
 * 직접 쓴다. 그런데 step마다 GITHUB_STEP_SUMMARY 파일이 따로라 다른 step에서 그 내용을
 * 읽을 수 없다. 그래서 json 리포터를 함께 켜고 여기서 다시 요약한다.
 */
const RESULT_PATH = process.argv[2] ?? 'ci-report/vitest.json'
const SECTION_PATH = 'ci-report/10-tests.md'

const buildSection = (report) => {
  const passed = report.numPassedTests ?? 0
  const failed = report.numFailedTests ?? 0
  const total = report.numTotalTests ?? 0
  const files = report.numTotalTestSuites ?? 0
  const heading = report.success ? '## ✅ 단위·통합 테스트 통과' : '## ❌ 단위·통합 테스트 실패'

  const rows = [
    `| 테스트 | ${passed} / ${total} |`,
    `| 스위트 | ${report.numPassedTestSuites ?? 0} / ${files} |`,
  ]
  if (failed > 0) rows.push(`| **실패** | **${failed}** |`)

  return [heading, '', '| 항목 | 결과 |', '| --- | ---: |', ...rows, ''].join('\n')
}

const main = async () => {
  await mkdir('ci-report', { recursive: true })

  let report
  try {
    report = JSON.parse(await readFile(RESULT_PATH, 'utf8'))
  } catch (error) {
    // 테스트가 결과 파일을 남기지 못한 경우다. 조용히 넘기지 않고 그 사실을 적는다.
    const message = error instanceof Error ? error.message : String(error)
    const fallback = `## ⚠️ 테스트 결과를 읽지 못함\n\n\`${RESULT_PATH}\`: ${message}\n`
    process.stdout.write(fallback)
    await writeFile(SECTION_PATH, fallback)
    return
  }

  const section = buildSection(report)
  process.stdout.write(section)
  await writeFile(SECTION_PATH, section)
}

await main()
