import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { review } from './pr-review.mjs';

import { server } from '@tests/msw/server';

/**
 * 리뷰는 저장소를 읽어 입력을 만든다. 실제 커밋 두 개를 만들어 base·head를 준다.
 * 변경 파일에는 이 프로젝트가 실증 기록마다 넣는 스크린샷(바이너리)을 섞는다.
 */
let repository = '';
let promptFile = '';
let base = '';
let head = '';

const git = (...args: string[]) =>
  execFileSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd: repository, encoding: 'utf8' },
  ).trim();

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), 'pr-review-'));
  promptFile = join(repository, 'prompt.md');
  writeFileSync(promptFile, 'Review the diff.');

  git('init', '-q', '-b', 'main');
  writeFileSync(join(repository, 'AGENTS.md'), '# AGENTS\n\n## 코드 규칙\n');
  writeFileSync(join(repository, 'CONVENTIONS.md'), '# CONVENTIONS\n');
  mkdirSync(join(repository, 'src'));
  writeFileSync(join(repository, 'src', 'a.ts'), 'export const a = 1;\n');
  git('add', '-A');
  git('commit', '-qm', 'base');
  base = git('rev-parse', 'HEAD');

  writeFileSync(join(repository, 'src', 'a.ts'), 'export const a = 2;\n');
  mkdirSync(join(repository, 'docs', 'rfc', 'images'), { recursive: true });
  writeFileSync(
    join(repository, 'docs', 'rfc', 'images', 'shot.png'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x1a, 0x0a]),
  );
  git('add', '-A');
  git('commit', '-qm', 'head');
  head = git('rev-parse', 'HEAD');
});

afterEach(() => rmSync(repository, { recursive: true, force: true }));

const reviewFixture = (apiKey = '') =>
  review({ cwd: repository, base, head, apiKey, promptFile });

it('변경 파일에 바이너리가 섞여도 입력을 만들고 제외 사실을 남긴다', async () => {
  const result = await review({
    cwd: repository,
    base,
    head,
    apiKey: '',
    promptFile,
    prepareOnly: true,
  });

  expect(result.status).toBe('prepared');
  expect(result.sourceFiles).toContain('src/a.ts');
  expect(result.sourceFiles).not.toContain('docs/rfc/images/shot.png');
  expect(result.limitations).toContain(
    'docs/rfc/images/shot.png: 텍스트가 아니라 소스에서 제외',
  );
});

it('형식이 어긋난 지적만 버리고 확인 가능한 지적은 남긴다', async () => {
  const finding = {
    rule: 'AGENTS.md#코드 규칙',
    line: 1,
    evidence: '규칙과 어긋난 부분',
    confidence: 'high',
  };
  server.use(
    http.post('https://api.openai.com/v1/responses', () =>
      HttpResponse.json({
        status: 'completed',
        usage: {},
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  status: 'completed',
                  rules_read: ['AGENTS.md', 'CONVENTIONS.md'],
                  limitations: [],
                  findings: [
                    { ...finding, path: 'src/a.ts' },
                    // 변경 목록에 없는 파일 — 작성자가 대조할 수 없다
                    { ...finding, path: 'src/gone.ts' },
                  ],
                }),
              },
            ],
          },
        ],
      }),
    ),
  );

  const result = await reviewFixture('test-key');

  expect(result.findings).toHaveLength(1);
  expect(result.findings[0].path).toBe('src/a.ts');
  expect(result.limitations).toContainEqual(
    expect.stringContaining('형식이 어긋난 지적 1건 제외'),
  );
  // 지적을 버렸으니 완료로 보고하지 않는다
  expect(result.status).toBe('partial');
});
