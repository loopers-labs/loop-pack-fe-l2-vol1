import { appendFileSync, readFileSync } from "node:fs";

const KB = 1000;
const formatKb = (bytes) => `${(bytes / KB).toFixed(1)} kB`;
const formatDelta = (bytes) => `${bytes > 0 ? "+" : ""}${(bytes / KB).toFixed(1)} kB`;

const renderRow = ({ name, passed, size, sizeLimit }) => {
  const route = name.replace(/^First Load JS /, "");
  const delta = size - sizeLimit;
  return `| ${passed ? "✅" : "❌"} | \`${route}\` | ${formatKb(sizeLimit)} | ${formatKb(size)} | ${formatDelta(delta)} |`;
};

const renderMarkdown = (results) => {
  const failed = results.filter((result) => !result.passed);
  const title =
    failed.length > 0
      ? "## ❌ 번들 예산 초과 (First Load JS, brotli)"
      : "## ✅ 번들 예산 통과 (First Load JS, brotli)";
  const table = [
    "| | route | 예산 | 실측 | 차이 |",
    "| --- | --- | --- | --- | --- |",
    ...results.map(renderRow),
  ].join("\n");
  const hint =
    failed.length > 0
      ? "원인 추적: `pnpm build && pnpm exec next analyze` 로 어떤 모듈이 새로 들어왔는지 보고, `.next/diagnostics/route-bundle-stats.json` 을 main 과 비교한다. 예산 근거는 `docs/rfc/week10-ci.md` 3단계."
      : "예산 = 기준 빌드 실측 × 1.05 (올림). 근거는 `docs/rfc/week10-ci.md` 3단계.";
  return [title, "", table, "", hint, ""].join("\n");
};

const main = () => {
  const [inputPath] = process.argv.slice(2);
  const raw = readFileSync(inputPath, "utf8");
  let results;
  try {
    results = JSON.parse(raw);
    if (!Array.isArray(results)) throw new TypeError("size-limit --json 은 배열이어야 한다");
  } catch {
    const fallback = [
      "## ❌ size-limit 출력을 읽을 수 없습니다",
      "",
      "```",
      raw.trim(),
      "```",
      "",
    ].join("\n");
    process.stdout.write(fallback);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, fallback);
    process.exit(1);
  }

  const markdown = renderMarkdown(results);
  process.stdout.write(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  if (process.env.GITHUB_ACTIONS) {
    for (const { name, size, sizeLimit } of results.filter((result) => !result.passed)) {
      process.stdout.write(
        `::error title=size-limit::${name} ${formatKb(size)} > 예산 ${formatKb(sizeLimit)} (${formatDelta(size - sizeLimit)})\n`,
      );
    }
  }
};

main();
