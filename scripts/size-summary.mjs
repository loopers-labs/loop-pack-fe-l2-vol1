// size-limit --json 결과를 PR 화면에서 바로 읽히는 표로 바꾼다.
// 로그를 열어야만 무엇이 얼마나 초과했는지 알 수 있으면 게이트가 실무에서 안 읽힌다.
import { readFileSync } from "node:fs";

// 예산 300 kB 의 근거가 된 회선. Lighthouse·DevTools 의 Slow 4G(1.6 Mbps).
const SLOW_4G_BYTES_PER_SECOND = 200_000;
// size-limit 이 "300 KB" 를 십진 300,000 바이트로 읽으므로 표기도 십진으로 맞춘다.
const BYTES_PER_KB = 1000;

const STDIN = 0;

const formatKb = (bytes) => `${(bytes / BYTES_PER_KB).toFixed(1)} kB`;
const formatSeconds = (bytes) =>
  `${(bytes / SLOW_4G_BYTES_PER_SECOND).toFixed(2)}s`;

function formatRow({ name, passed, size, sizeLimit }) {
  const gap = sizeLimit - size;
  const verdict = passed
    ? `여유 ${formatKb(gap)}`
    : `**초과 ${formatKb(-gap)}**`;

  return `| ${passed ? "✅" : "❌"} ${name} | ${formatKb(size)} | ${formatKb(sizeLimit)} | ${verdict} | ${formatSeconds(size)} |`;
}

const results = JSON.parse(readFileSync(STDIN, "utf8"));

// size-limit 은 --json 모드에서 대상 파일을 못 찾아도 size 0 으로 "통과"를 보고한다.
// 빌드 전에 실행되면 빈 산출물을 재고 초록불이 나오므로, 진짜 실패보다 위험하다.
const EMPTY_BUILD_SIZE = 0;

if (results.some((result) => result.size === EMPTY_BUILD_SIZE)) {
  console.log("## 번들 예산 측정 실패");
  console.log();
  console.log(
    "측정 대상 파일을 찾지 못했다. `pnpm build` 뒤에 실행됐는지 확인할 것.",
  );
  process.exit(1);
}

const hasFailure = results.some((result) => !result.passed);

console.log(`## 번들 예산 ${hasFailure ? "초과" : "통과"}`);
console.log();
console.log("| 대상 | 현재 | 예산 | 차이 | Slow 4G 전송 |");
console.log("| --- | ---: | ---: | ---: | ---: |");
results.forEach((result) => console.log(formatRow(result)));
console.log();
console.log(
  "**예산 300 kB** = 가정한 회선 Slow 4G(1.6 Mbps = 200,000 B/s) × 1.5초. 측정값이 아니라 기준을 세우려고 잡은 가정이다.",
);

if (hasFailure) process.exit(1);
