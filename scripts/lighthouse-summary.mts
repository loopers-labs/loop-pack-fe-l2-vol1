// Lighthouse JSON 결과를 job summary용 표로 바꾼다.
//
//   node scripts/lighthouse-summary.mts <이름> <결과.json> [<이름> <결과.json> ...]
//
// **임계값을 두지 않는다.** 이 저장소에는 배포가 없어 러너 안에서 띄워 재는데,
// 7주차에 맥에서 잰 LCP 3,073ms를 그대로 임계값으로 옮길 수 없다(조건이 다르다).
// 러너 기준선이 쌓이기 전에 임계값을 걸면 근거 없는 숫자가 된다. 그래서 기록만 남긴다.
// 근거: docs/rfc/week10-ci.md

import { appendFileSync, readFileSync } from 'node:fs';

type Audit = { numericValue?: number; displayValue?: string };
type Report = {
  categories?: { performance?: { score?: number | null } };
  audits?: Record<string, Audit>;
};

function isReport(value: unknown): value is Report {
  return typeof value === 'object' && value !== null;
}

function read(path: string): Report {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isReport(parsed)) {
    throw new Error(`Lighthouse 결과를 읽을 수 없다: ${path}`);
  }
  return parsed;
}

function metric(report: Report, id: string): string {
  const audit = report.audits?.[id];
  if (audit === undefined) return '—';
  if (audit.displayValue !== undefined) return audit.displayValue;
  if (audit.numericValue !== undefined)
    return `${Math.round(audit.numericValue)}`;
  return '—';
}

function score(report: Report): string {
  const raw = report.categories?.performance?.score;
  return typeof raw === 'number' ? `${Math.round(raw * 100)}` : '—';
}

const args = process.argv.slice(2);
if (args.length === 0 || args.length % 2 !== 0) {
  process.stdout.write(
    '사용법: lighthouse-summary.mts <이름> <결과.json> [...]\n',
  );
  process.exitCode = 1;
} else {
  const rows = [
    '| 화면 | 성능 점수 | LCP | CLS | TBT |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i] ?? '';
    const path = args[i + 1] ?? '';
    const report = read(path);
    rows.push(
      `| ${name} | ${score(report)} | ${metric(report, 'largest-contentful-paint')} | ${metric(report, 'cumulative-layout-shift')} | ${metric(report, 'total-blocking-time')} |`,
    );
  }

  const summary = [
    '### Lighthouse (기록 전용)',
    '',
    ...rows,
    '',
    '임계값을 두지 않는다. 러너에서 잰 값이라 7주차 맥 측정치와 직접 비교할 수 없고,',
    '기준선이 쌓이기 전의 임계값은 근거가 없다. 추세를 보는 용도다.',
    '',
  ].join('\n');

  process.stdout.write(summary + '\n');
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath !== undefined && summaryPath !== '') {
    appendFileSync(summaryPath, summary + '\n');
  }
}
