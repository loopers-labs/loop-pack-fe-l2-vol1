// 번들 예산. `next build` 뒤에 돈다.
//
// ── 왜 자체 스크립트인가 ────────────────────────────────────────────────────
// `size-limit`을 쓰지 않았다. Next 16은 build 출력에 크기를 찍지 않고 청크 이름이
// 해시라, 어느 도구든 `.next/build-manifest.json`을 읽어 매핑해야 한다. 그 매핑이
// 이 스크립트의 본체이고, 도구를 얹으면 의존성만 하나 늘어난다.
// 대신 도구가 공짜로 주는 것(PR 코멘트)은 `$GITHUB_STEP_SUMMARY`로 직접 낸다.
//
// ── 단위: gzip 전송 크기 ────────────────────────────────────────────────────
// raw 바이트가 아니라 gzip이다. 사용자가 기다리는 것은 전송이고, 7주차에 이미
// **전송 크기**로 쟀다(Hero 이미지 7,545,525B). 같은 단위를 쓴다.
//
// ── 임계값의 근거 (임의 숫자 아님) ──────────────────────────────────────────
// 7주차 측정: `--throttling-method=devtools`(Lighthouse Slow 4G ≈ 1.6Mbps ≈ 200KB/s)에서
// **LCP 중앙값 1,886ms**(폭 15ms). 이게 지켜야 할 예산이다.
//
// 셸 JS는 첫 화면이 그려지기 전에 내려가야 하는 바닥값이므로, **LCP 예산의 절반**을
// 넘지 않게 둔다.
//
//     1,886ms × 50% = 943ms
//     943ms × 200KB/s = 188KB
//
// 현재 셸은 **167KB(836ms, LCP 예산의 44%)** 이므로 여유가 21KB(12.5%)다.
// "현재값 + 적당히"가 아니라 **LCP 예산에서 거꾸로 계산한 값**이고, 마침 현재값이
// 그 아래에 있다.
//
// 전체 청크는 성격이 다르다 — 지연 로드되는 것까지 포함하므로 첫 화면 비용이 아니다.
// 그래서 유도하지 않고 **회귀 가드**로 둔다: 현재값 + 셸과 같은 여유 비율(12.5%).
// 이건 개선 목표가 아니라 "모르는 사이에 늘지 않게" 하는 선이다. 그렇게 적어 둔다.
import { appendFileSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { globSync } from "node:fs";
import path from "node:path";

const NEXT_DIR = ".next";
const KB = 1024;

// 7주차 측정에서 온 상수. 바꾸려면 다시 재고 근거를 같이 고친다.
const LCP_BUDGET_MS = 1886; // 7주차 After 중앙값
const THROTTLE_KB_PER_SEC = 200; // Lighthouse Slow 4G ≈ 1.6Mbps
const SHELL_SHARE_OF_LCP = 0.5;

const SHELL_BUDGET_KB = Math.round(
  ((LCP_BUDGET_MS * SHELL_SHARE_OF_LCP) / 1000) * THROTTLE_KB_PER_SEC,
);
const TOTAL_BUDGET_KB = 268; // 현재 233KB + 12.5% (셸과 같은 여유 비율) — 회귀 가드

type Budget = { name: string; files: string[]; budgetKb: number; note: string };

// ⚠️ 예전엔 없는 파일을 조용히 건너뛰고 합계를 돌려줬다. 그러면 매니페스트의 청크가
// 하나도 실재하지 않을 때 **0KB로 예산을 통과한다** — false green이다.
// (빌드 산출물 경로가 바뀌거나, 매니페스트 키 이름이 달라지면 그렇게 된다.)
// 게이트가 "아무것도 못 찾았다"를 통과로 읽으면 게이트가 아니다.
// Codex 교차 검증에서 나온 자리다.
function gzipBytes(files: string[], label: string): number {
  let total = 0;
  let found = 0;
  for (const file of files) {
    const full = path.join(NEXT_DIR, file);
    try {
      statSync(full);
    } catch {
      continue;
    }
    found += 1;
    total += gzipSync(readFileSync(full), { level: 9 }).length;
  }
  if (found === 0) {
    throw new Error(
      `[${label}] 잴 파일을 하나도 찾지 못했습니다(대상 ${files.length}개). ` +
        `pnpm build 를 먼저 돌렸는지, ${NEXT_DIR}/build-manifest.json 의 키가 바뀌지 않았는지 확인하세요. ` +
        `0KB로 통과시키지 않습니다.`,
    );
  }
  return total;
}

let manifest: { rootMainFiles: string[]; polyfillFiles: string[] };
try {
  const raw = readFileSync(path.join(NEXT_DIR, "build-manifest.json"), "utf8");
  manifest = JSON.parse(raw);
} catch {
  console.error(`${NEXT_DIR}/build-manifest.json을 읽을 수 없습니다. pnpm build를 먼저 돌리세요.`);
  process.exitCode = 1;
  throw new Error("build manifest 없음");
}

const allChunks = globSync("static/chunks/**/*.js", { cwd: NEXT_DIR });

const budgets: Budget[] = [
  {
    name: "셸 JS (첫 진입에 반드시 내려간다)",
    files: [...manifest.rootMainFiles, ...manifest.polyfillFiles],
    budgetKb: SHELL_BUDGET_KB,
    note: `LCP 예산 ${LCP_BUDGET_MS}ms의 ${SHELL_SHARE_OF_LCP * 100}% ÷ ${THROTTLE_KB_PER_SEC}KB/s에서 유도`,
  },
  {
    name: "전체 청크 (지연 로드 포함)",
    files: allChunks,
    budgetKb: TOTAL_BUDGET_KB,
    note: "회귀 가드 — 개선 목표가 아니라 모르는 사이에 늘지 않게 하는 선",
  },
];

const rows: string[] = [];
let exceeded = 0;

for (const budget of budgets) {
  const actualKb = gzipBytes(budget.files, budget.name) / KB;
  const over = actualKb > budget.budgetKb;
  if (over) {
    exceeded += 1;
  }
  const diff = actualKb - budget.budgetKb;
  const transferMs = Math.round((actualKb / THROTTLE_KB_PER_SEC) * 1000);
  rows.push(
    `| ${over ? "❌" : "✅"} ${budget.name} | **${actualKb.toFixed(1)} KB** | ${budget.budgetKb} KB | ${diff >= 0 ? "+" : ""}${diff.toFixed(1)} KB | ${transferMs}ms | ${budget.note} |`,
  );
}

const lines = [
  "## 번들 예산 (gzip 전송 크기)",
  "",
  "| | 현재 | 예산 | 차이 | 200KB/s 전송 | 임계값 근거 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows,
  "",
];

if (exceeded > 0) {
  lines.push(
    `**예산을 ${exceeded}건 초과했습니다.** 무엇이 늘었는지는 \`.next/static/chunks\`를 크기순으로 보세요:`,
    "",
    "```bash",
    "pnpm build && ls -S .next/static/chunks/*.js | head",
    "```",
    "",
    "예산을 올리려면 `scripts/check-bundle-size.mts`의 근거 주석을 같이 고쳐야 합니다 — 숫자만 올리면 근거 없는 임계값이 됩니다.",
  );
} else {
  lines.push("예산 안입니다.");
}

const report = lines.join("\n");

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath !== undefined && summaryPath !== "") {
  appendFileSync(summaryPath, `${report}\n\n`);
}
console.warn(report);

if (exceeded > 0) {
  process.exitCode = 1;
}
