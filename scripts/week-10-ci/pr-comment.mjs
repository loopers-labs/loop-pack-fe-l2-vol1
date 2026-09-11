// Quality run의 결과를 PR 코멘트 하나로 갱신한다. workflow_run으로 default branch의
// 코드만 실행하며 PR 코드는 체크아웃도 실행도 하지 않는다. 검사를 다시 돌리지 않고
// Quality가 남긴 리포트와 job 결론만 읽는다. 생략·게시 실패는 게이트 결과를 바꾸지 않는다.
import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '<!-- quality-ci -->';
const BOT = 'github-actions[bot]';
const ICONS = {
  success: '✅',
  failure: '❌',
  cancelled: '⏹️',
  skipped: '⏭️',
};
// Quality의 job id와 코멘트에 쓸 이름. 이 목록이 코멘트의 검사 상태 표다.
const JOBS = [
  ['changes', '변경 판별'],
  ['checks', 'lint·typecheck·테스트'],
  ['build-e2e', 'build·env·번들 예산·E2E'],
  ['guard', '병합 게이트'],
];
// 리포트는 PR 코드가 만든 산출물이다 — 렌더링은 살리되 코멘트 마커 위조와 멘션은 막는다.
const REPORT_LIMIT = 8_192;
const safe = (markdown) =>
  markdown
    .slice(0, REPORT_LIMIT)
    .replaceAll('<!--', '&lt;!--')
    .replaceAll('@', '@​');

const env = (name) => process.env[name] ?? '';

const writeSummary = (message) => {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
  }
};

const repository = env('GITHUB_REPOSITORY');
const runId = env('RUN_ID');
const runAttempt = env('RUN_ATTEMPT');
const headSha = env('HEAD_SHA');
const reportsDir = env('REPORTS_DIR') || 'reports';

const api = async (path, options = {}) => {
  const response = await fetch(
    `${env('GITHUB_API_URL') || 'https://api.github.com'}/repos/${repository}${path}`,
    {
      ...options,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${env('GH_TOKEN')}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub API ${options.method ?? 'GET'} ${path} — HTTP ${response.status}`,
    );
  }
  return response.json();
};

const skip = (reason) => {
  writeSummary(
    `## PR 코멘트: 생략\n\n${reason}. 검증 결과는 Quality run의 summary에 남아 있다.`,
  );
  process.exit(0);
};

const readReport = (name) => {
  try {
    return safe(readFileSync(join(reportsDir, name), 'utf8').trim());
  } catch {
    return '';
  }
};

// 배선이 빠지면 빈 값이 조용히 흘러 엉뚱한 대상에 게시된다.
const missing = [
  'GITHUB_REPOSITORY',
  'RUN_ID',
  'RUN_ATTEMPT',
  'HEAD_SHA',
].filter((name) => !env(name));
if (missing.length > 0) {
  writeSummary(
    `## PR 코멘트: 게시 실패\n\n게시 대상이 비었다 — workflow 배선 누락: ${missing.join(', ')}`,
  );
  process.exit(1);
}

let body = '';
try {
  const { jobs } = await api(`/actions/runs/${runId}/jobs?per_page=100`);
  const conclusionOf = (id) =>
    jobs.find((job) => job.name === id)?.conclusion ?? '미실행';
  const results = JOBS.map(([id, label]) => [label, conclusionOf(id)]);
  // 네 job은 모든 PR run에서 실행 조건이 참이라 skipped가 나올 수 없다.
  // 나왔다면 그것이 곧 "예상 밖 생략"이므로 성공으로 바꾸지 않는다.
  const failed = results.some(([, conclusion]) => conclusion !== 'success');
  const buildResult = conclusionOf('build-e2e');
  const unmeasured = (what) =>
    `## ${what}: 미측정\n\nbuild·env·E2E job이 ${buildResult} — 이 검사의 리포트가 없다.`;

  const runUrl = `${env('GITHUB_SERVER_URL')}/${repository}/actions/runs/${runId}/attempts/${runAttempt}`;
  body = `${MARKER}
<!-- run:${runId} attempt:${runAttempt} -->
## Quality CI: ${failed ? 'FAIL' : 'PASS'}

검증 SHA: \`${headSha}\`

| 검사 | 결과 |
| --- | --- |
${results.map(([label, conclusion]) => `| ${label} | ${ICONS[conclusion] ?? '❔'} ${conclusion} |`).join('\n')}

${readReport('budget.md') || unmeasured('번들 예산')}

${readReport('env.md') || unmeasured('env 검증')}

[전체 측정표·선택 테스트·리포트·trace 보기](${runUrl})
`;

  const candidates = await api(`/commits/${headSha}/pulls?per_page=100`);
  const open = candidates.filter(
    (pull) => pull.state === 'open' && pull.head?.sha === headSha,
  );
  if (open.length !== 1) {
    skip(`이 SHA에 대응하는 열린 PR을 하나로 확정할 수 없다(${open.length}개)`);
  }
  const number = open[0].number;

  const current = await api(`/pulls/${number}`);
  if (current.head?.sha !== headSha) {
    skip(
      `PR head가 \`${current.head?.sha}\`로 전진해 이 run(\`${headSha}\`)의 결과를 게시하지 않는다`,
    );
  }

  const comments = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await api(
      `/issues/${number}/comments?per_page=100&page=${page}`,
    );
    comments.push(...batch);
    if (batch.length < 100) break;
  }
  // 마커와 봇 작성자로 이 workflow의 코멘트만 고른다 — 다른 봇 코멘트를 덮지 않는다.
  const previous = comments.find(
    (comment) =>
      comment.user?.login === BOT && comment.body?.startsWith(MARKER),
  );

  const posted = previous?.body.match(/<!-- run:(\d+) attempt:(\d+) -->/);
  if (
    posted &&
    (Number(posted[1]) > Number(runId) ||
      (posted[1] === runId && Number(posted[2]) > Number(runAttempt)))
  ) {
    skip(
      `더 최신 실행(run ${posted[1]} attempt ${posted[2]})의 결과가 이미 게시돼 덮어쓰지 않는다`,
    );
  }

  await api(
    previous ? `/issues/comments/${previous.id}` : `/issues/${number}/comments`,
    { method: previous ? 'PATCH' : 'POST', body: JSON.stringify({ body }) },
  );
  writeSummary(
    `## PR 코멘트: ${previous ? '갱신' : '생성'}\n\nPR #${number} · 검증 SHA \`${headSha}\``,
  );
} catch (error) {
  writeSummary(
    `## PR 코멘트: 게시 실패\n\n${error.message}. 게이트 결과는 그대로 유지된다.\n\n${body.replace(MARKER, '')}`,
  );
  process.exit(1);
}
