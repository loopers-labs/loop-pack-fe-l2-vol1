import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

// GitHub API 응답만 대체한다. CLI 진입·대상 판정·본문 구성·종료 처리는 실제로 실행한다.
const SCRIPT = fileURLToPath(new URL('./pr-comment.mjs', import.meta.url));
const REPOSITORY = 'owner/repo';
const HEAD_SHA = 'a'.repeat(40);
const NEXT_SHA = 'b'.repeat(40);
const RUN_ID = '200';
const BUDGET_REPORT =
  '## 번들 예산: FAIL\n\n| 홈 초기 JS | 175,000 B | **초과 3,644 B (+2.1%)** |\n';
const ENV_REPORT = '## env 검증: PASS\n\n빌드용·서버 실행 검사 통과.\n';

const cwd = mkdtempSync(join(tmpdir(), 'pr-comment-'));
const reportsDir = join(cwd, 'reports');
const summaryPath = join(cwd, 'summary.md');

const state = {
  headSha: HEAD_SHA,
  associated: [] as Record<string, unknown>[],
  comments: [] as Record<string, unknown>[],
  jobs: [] as Record<string, unknown>[],
  failWrite: false,
  requests: [] as { method: string; url: string; body: string }[],
};

let server: Server;
let apiUrl: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const url = request.url ?? '';
      state.requests.push({ method: request.method ?? '', url, body });
      const send = (status: number, payload: unknown) => {
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(JSON.stringify(payload));
      };
      if (url.includes('/actions/runs/')) {
        send(200, { jobs: state.jobs });
      } else if (url.includes('/commits/')) {
        send(200, state.associated);
      } else if (url.includes('/pulls/')) {
        send(200, { head: { sha: state.headSha } });
      } else if (request.method === 'GET') {
        send(200, state.comments);
      } else if (state.failWrite) {
        send(502, { message: 'bad gateway' });
      } else {
        send(200, { id: 1 });
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  apiUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.close();
  await once(server, 'close');
  rmSync(cwd, { recursive: true, force: true });
});

beforeEach(() => {
  state.headSha = HEAD_SHA;
  state.associated = [{ number: 42, state: 'open', head: { sha: HEAD_SHA } }];
  state.comments = [];
  state.jobs = [
    { name: 'changes', conclusion: 'success' },
    { name: 'checks', conclusion: 'success' },
    { name: 'build-e2e', conclusion: 'failure' },
    { name: 'guard', conclusion: 'failure' },
  ];
  state.failWrite = false;
  state.requests = [];
  writeFileSync(summaryPath, '');
  rmSync(reportsDir, { recursive: true, force: true });
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(join(reportsDir, 'budget.md'), BUDGET_REPORT);
  writeFileSync(join(reportsDir, 'env.md'), ENV_REPORT);
});

// 스텁 서버가 이 프로세스의 이벤트 루프에서 응답하므로 동기 spawn을 쓰면 교착된다.
const runComment = async (overrides: Record<string, string> = {}) => {
  const child = spawn(process.execPath, [SCRIPT], {
    cwd,
    timeout: 20_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      NODE_ENV: 'test',
      GITHUB_API_URL: apiUrl,
      GH_TOKEN: 'test-token',
      GITHUB_REPOSITORY: REPOSITORY,
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_STEP_SUMMARY: summaryPath,
      RUN_ID,
      RUN_ATTEMPT: '1',
      HEAD_SHA,
      REPORTS_DIR: reportsDir,
      ...overrides,
    },
  });

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const [status] = await once(child, 'close');

  return {
    status: status as number,
    output,
    summary: readFileSync(summaryPath, 'utf8'),
  };
};

const writes = () =>
  state.requests.filter(
    ({ method }) => method === 'POST' || method === 'PATCH',
  );
const postedBody = () => JSON.parse(writes()[0].body).body as string;

it('이전 코멘트가 없으면 새로 만들고 job 결과·SHA·예산 초과량·상세 링크를 담는다', async () => {
  const result = await runComment();

  expect(result.status).toBe(0);
  expect(writes()).toHaveLength(1);
  expect(writes()[0].method).toBe('POST');
  expect(postedBody()).toContain('## Quality CI: FAIL');
  expect(postedBody()).toContain(`검증 SHA: \`${HEAD_SHA}\``);
  expect(postedBody()).toContain('| 병합 게이트 | ❌ failure |');
  expect(postedBody()).toContain('초과 3,644 B (+2.1%)');
  expect(postedBody()).toContain('## env 검증: PASS');
  expect(postedBody()).toContain(
    `https://github.com/owner/repo/actions/runs/${RUN_ID}/attempts/1`,
  );
});

const allSuccess = () =>
  ['changes', 'checks', 'build-e2e', 'guard'].map((name) => ({
    name,
    conclusion: 'success',
  }));

it('네 job이 모두 성공하면 전체를 PASS로 표시한다', async () => {
  state.jobs = allSuccess();

  await runComment();

  expect(postedBody()).toContain('## Quality CI: PASS');
});

// 네 job은 PR run에서 실행 조건이 항상 참이다 — skipped는 곧 예상 밖 생략이라
// 성공으로 바뀌면 안 된다. null(미완료)·job 누락도 같다.
it.each([
  ['생략됐으면', 'skipped', '⏭️ skipped'],
  ['취소됐으면', 'cancelled', '⏹️ cancelled'],
  ['결론이 없으면', null, '❔ 미실행'],
])('필요한 job이 %s PASS로 표시하지 않는다', async (_, conclusion, cell) => {
  state.jobs = allSuccess().map((job) =>
    job.name === 'build-e2e' ? { ...job, conclusion } : job,
  );

  await runComment();

  expect(postedBody()).toContain('## Quality CI: FAIL');
  expect(postedBody()).toContain(`| build·env·번들 예산·E2E | ${cell} |`);
});

it('job 목록에 없는 job은 미실행으로 표시하고 PASS로 두지 않는다', async () => {
  state.jobs = allSuccess().filter((job) => job.name !== 'guard');

  await runComment();

  expect(postedBody()).toContain('## Quality CI: FAIL');
  expect(postedBody()).toContain('| 병합 게이트 | ❔ 미실행 |');
});

it('마커가 같은 봇 코멘트가 있으면 새로 달지 않고 그 코멘트만 갱신한다', async () => {
  state.comments = [
    {
      id: 11,
      user: { login: 'github-actions[bot]' },
      body: '<!-- ai-review:x -->\nAI 리뷰',
    },
    {
      id: 12,
      user: { login: 'heeji289' },
      body: '<!-- quality-ci -->\n사람이 흉내낸 코멘트',
    },
    {
      id: 13,
      user: { login: 'github-actions[bot]' },
      body: '<!-- quality-ci -->\n<!-- run:100 attempt:1 -->\n이전 결과',
    },
  ];

  const result = await runComment();

  expect(result.status).toBe(0);
  expect(writes()).toHaveLength(1);
  expect(writes()[0].method).toBe('PATCH');
  expect(writes()[0].url).toBe('/repos/owner/repo/issues/comments/13');
});

it('더 최신 run의 결과가 이미 게시됐으면 덮어쓰지 않는다', async () => {
  state.comments = [
    {
      id: 13,
      user: { login: 'github-actions[bot]' },
      body: '<!-- quality-ci -->\n<!-- run:201 attempt:1 -->\n최신 결과',
    },
  ];

  const result = await runComment();

  expect(result.status).toBe(0);
  expect(writes()).toHaveLength(0);
  expect(result.summary).toContain('PR 코멘트: 생략');
  expect(result.summary).toContain('run 201');
});

it('PR head가 전진했으면 오래된 결과를 게시하지 않는다', async () => {
  state.headSha = NEXT_SHA;

  const result = await runComment();

  expect(result.status).toBe(0);
  expect(writes()).toHaveLength(0);
  expect(result.summary).toContain('PR 코멘트: 생략');
  expect(result.summary).toContain(NEXT_SHA);
});

it('이 SHA의 열린 PR을 하나로 확정할 수 없으면 게시하지 않는다', async () => {
  state.associated = [];

  const result = await runComment();

  expect(result.status).toBe(0);
  expect(writes()).toHaveLength(0);
  expect(result.summary).toContain('하나로 확정할 수 없다(0개)');
});

it('게시가 실패하면 종료 코드 1과 함께 검증 결과를 summary에 남긴다', async () => {
  state.failWrite = true;

  const result = await runComment();

  expect(result.status).toBe(1);
  expect(result.summary).toContain('PR 코멘트: 게시 실패');
  expect(result.summary).toContain('HTTP 502');
  expect(result.summary).toContain('초과 3,644 B (+2.1%)');
});

it('선행 실패로 리포트가 없으면 미측정과 그 이유를 표시한다', async () => {
  rmSync(reportsDir, { recursive: true, force: true });

  const result = await runComment();

  expect(result.status).toBe(0);
  expect(postedBody()).toContain('## 번들 예산: 미측정');
  expect(postedBody()).toContain('## env 검증: 미측정');
  expect(postedBody()).toContain('build·env·E2E job이 failure');
});

// 리포트는 PR 코드가 만든다 — fork PR이 코멘트 마커나 멘션을 심을 수 있다.
it('리포트가 코멘트 마커나 멘션을 심어도 그대로 게시하지 않는다', async () => {
  writeFileSync(
    join(reportsDir, 'budget.md'),
    '<!-- run:999999 attempt:9 -->\n@everyone 예산 통과\n',
  );

  await runComment();

  expect(postedBody()).not.toContain('<!-- run:999999');
  expect(postedBody()).not.toContain('@everyone');
  expect(postedBody()).toContain('&lt;!-- run:999999');
});

it('workflow 배선이 빠져 대상이 비면 게시하지 않고 누락된 이름을 알린다', async () => {
  const result = await runComment({ RUN_ID: '', HEAD_SHA: '' });

  expect(result.status).toBe(1);
  expect(state.requests).toHaveLength(0);
  expect(result.summary).toContain('배선 누락: RUN_ID, HEAD_SHA');
});
