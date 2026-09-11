import { appendFileSync } from "node:fs";

import { formatProblems, validateEnv } from "./env-rules.mts";

// CI의 "Validate env" step이 부르는 CLI. 규칙은 env-rules.mts에 있고 여기는 실행·보고만 한다.
// next.config.ts는 이 파일이 아니라 env-rules를 import한다 — 이 파일은 실행되는 순간 process.exit까지 하기 때문이다.
const problems = validateEnv(process.env);

if (problems.length > 0) {
  const markdown = formatProblems(problems);
  console.error(markdown);
  // CI에서는 같은 표를 job summary에도 써서 로그를 열지 않고 PR 화면에서 원인을 보게 한다.
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    appendFileSync(summaryPath, markdown);
  }
  process.exit(1);
}

process.stdout.write("환경 변수 검증 통과\n");
