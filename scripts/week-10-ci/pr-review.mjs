import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const MODEL = 'gpt-5.6-luna';
const INPUT_LIMIT = 1024 * 1024;
const PROMPT = 'scripts/week-10-ci/pr-review.md';
const sensitivePath =
  /[\r\n\x00-\x1f]|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key)$|(?:^|\/)\.auth\//;
const isSensitivePath = (path) =>
  path !== '.env.example' && sensitivePath.test(path);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const object = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const string = { type: 'string' };
const strings = { type: 'array', items: string };
const schema = object({
  status: { enum: ['completed', 'partial'], type: 'string' },
  rules_read: strings,
  findings: {
    type: 'array',
    items: object({
      rule: string,
      path: string,
      line: { type: 'integer' },
      evidence: string,
      confidence: { type: 'string', enum: ['high', 'medium'] },
    }),
  },
  limitations: strings,
});

function runtimeFiles(files) {
  const temporary = mkdtempSync(join(tmpdir(), 'review-classify-'));
  try {
    const output = join(temporary, 'output');
    execFileSync(
      process.execPath,
      [join(directory, 'classify-changes.mjs'), '--local-diff'],
      {
        env: {
          PATH: process.env.PATH,
          ALL_FILES: JSON.stringify(files),
          EXPECTED_CHANGED_FILES: String(files.length),
          GITHUB_OUTPUT: output,
        },
        timeout: 10_000,
        stdio: 'pipe',
      },
    );
    return JSON.parse(
      readFileSync(output, 'utf8')
        .split('\n')
        .find((line) => line.startsWith('runtime_files='))
        .slice('runtime_files='.length),
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

export async function review({
  cwd = process.cwd(),
  base,
  head,
  rulesRef = base,
  apiKey,
  signal = AbortSignal.timeout(180_000),
  prepareOnly = false,
  promptFile = '',
}) {
  const deadline = Date.now() + 180_000;
  const result = {
    status: 'collection_failed',
    reason: '',
    route: '',
    base,
    head,
    rulesRef,
    model: MODEL,
    findings: [],
    limitations: [],
    rules: [],
    rules_read: [],
    sourceFiles: [],
  };
  let phase = 'collection_failed';
  try {
    if (![base, head, rulesRef].every((sha) => /^[a-f0-9]{40}$/.test(sha)))
      throw new Error('invalid_sha');
    const git = (...args) => {
      signal.throwIfAborted();
      if (Date.now() >= deadline) throw new Error('timeout');
      return execFileSync('git', ['--no-pager', ...args], {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: INPUT_LIMIT * 2,
        timeout: Math.max(1, Math.min(15_000, deadline - Date.now())),
      });
    };
    result.mergeBase = git('merge-base', base, head).trim();
    const files = git(
      'diff',
      '--no-renames',
      '--name-only',
      '-z',
      result.mergeBase,
      head,
      '--',
    )
      .split('\0')
      .filter(Boolean);
    if (!files.length)
      return { ...result, status: 'skipped', reason: 'empty_diff' };
    if (files.some(isSensitivePath))
      return {
        ...result,
        status: 'unsupported_input',
        reason: 'sensitive_or_control_path',
      };
    const runtime = runtimeFiles(files);
    const design = files.some((path) => /^(?:docs\/rfc|specs)\//.test(path));
    const guidance = files.some((path) =>
      /^(?:AGENTS\.md|CLAUDE\.md|CONVENTIONS\.md|\.claude\/|scripts\/week-10-ci\/pr-review\.)/.test(
        path,
      ),
    );
    result.route = guidance
      ? 'guidance'
      : runtime.length
        ? 'code'
        : design
          ? 'design'
          : 'docs';
    if (result.route === 'docs')
      return {
        ...result,
        status: 'skipped',
        reason: 'ordinary_docs_manual_review',
      };

    const tree = (sha) =>
      git('ls-tree', '-rz', sha)
        .split('\0')
        .filter(Boolean)
        .map((entry) => {
          const [header, ...path] = entry.split('\t');
          const [mode, type, oid] = header.split(' ');
          return { mode, type, oid, path: path.join('\t') };
        });
    const baseTree = tree(rulesRef);
    const skills = ['architecture-review', 'component-review'];
    if (design || files.some((path) => /test|spec|fixture|e2e/.test(path)))
      skills.push('test-review');
    if (design || files.some((path) => /state|store|query|auth/.test(path)))
      skills.push('state-design-review');
    if (design || files.some((path) => /e2e.*scope|events.*jsonl/.test(path)))
      skills.push('e2e-scope-review');
    const rulePaths = new Set([
      'AGENTS.md',
      'CONVENTIONS.md',
      ...baseTree
        .filter(
          ({ path }) =>
            /^\.claude\/rules\/.*\.md$/.test(path) ||
            skills.some((skill) => path === `.claude/skills/${skill}/SKILL.md`),
        )
        .map(({ path }) => path),
    ]);
    const read = (entry) => {
      if (
        !entry ||
        entry.type !== 'blob' ||
        !['100644', '100755', '120000'].includes(entry.mode)
      )
        throw new Error('unsupported_file');
      const content = git('cat-file', 'blob', entry.oid);
      if (content.includes('\0') || content.includes('\ufffd'))
        throw new Error('non_text_input');
      return content;
    };
    const prompt = promptFile
      ? readFileSync(promptFile, 'utf8')
      : read(baseTree.find(({ path }) => path === PROMPT));
    result.promptSource = promptFile || `${rulesRef}:${PROMPT}`;
    result.promptHash = hash(prompt);
    const rules = [...rulePaths].map((path) => ({
      path,
      content: read(baseTree.find((entry) => entry.path === path)),
    }));
    result.rules = rules.map(({ path, content }) => ({
      path,
      sha256: hash(content),
    }));

    // ponytail: 이 프로젝트의 텍스트 소스를 통째로 읽는다. 1MiB를 넘으면 부분 추출 대신 중단한다.
    const sourceFiles = tree(head).filter(
      ({ path }) =>
        !isSensitivePath(path) &&
        (files.includes(path) ||
          /^(?:src|tests|e2e|scripts|types)\/.*\.(?:[cm]?[jt]sx?|json|css|md)$/.test(
            path,
          ) ||
          /^\.github\/workflows\/.*\.ya?ml$/.test(path) ||
          /^[^/]+\.(?:json|[cm]?[jt]s)$/.test(path)),
    );
    phase = 'input_limit';
    let bytes = Buffer.byteLength(prompt + JSON.stringify(rules));
    const sources = [];
    for (const entry of sourceFiles) {
      if (Number(git('cat-file', '-s', entry.oid)) + bytes > INPUT_LIMIT)
        throw new Error('input_limit');
      // 변경 파일에는 스크린샷 같은 바이너리가 섞인다. 읽을 수 없는 파일만 빼고 나머지는 검토한다.
      let content;
      try {
        content = read(entry);
      } catch (error) {
        if (!['non_text_input', 'unsupported_file'].includes(error.message))
          throw error;
        result.limitations.push(`${entry.path}: 텍스트가 아니라 소스에서 제외`);
        continue;
      }
      bytes += Buffer.byteLength(JSON.stringify({ path: entry.path, content }));
      if (bytes > INPUT_LIMIT) throw new Error('input_limit');
      sources.push({ path: entry.path, content });
    }
    const diff = git(
      'diff',
      '--no-ext-diff',
      '--no-textconv',
      '--no-renames',
      '--unified=5',
      result.mergeBase,
      head,
      '--',
    );
    const instructions = `${prompt}\n\nTrusted review criteria (${rulesRef}):\n${JSON.stringify(rules)}`;
    const input = JSON.stringify({
      base,
      head,
      mergeBase: result.mergeBase,
      route: result.route,
      changedFiles: files,
      diff,
      sources,
    });
    result.inputBytes = Buffer.byteLength(instructions + input);
    if (result.inputBytes > INPUT_LIMIT) throw new Error('input_limit');
    result.inputHash = hash(instructions + input);
    result.sourceFiles = sources.map(({ path }) => path);
    if (prepareOnly) return { ...result, status: 'prepared' };
    if (!apiKey)
      return {
        ...result,
        status: 'auth_unavailable',
        reason: 'OPENAI_API_KEY_missing',
      };

    phase = 'api_failed';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        instructions,
        input,
        store: false,
        reasoning: { effort: 'low' },
        max_output_tokens: 6000,
        tools: [],
        text: {
          format: {
            type: 'json_schema',
            name: 'pr_review',
            strict: true,
            schema: {
              ...schema,
              properties: {
                ...schema.properties,
                rules_read: {
                  type: 'array',
                  items: { type: 'string', enum: [...rulePaths] },
                },
              },
            },
          },
        },
      }),
    });
    result.rateLimits = {
      requests: response.headers.get('x-ratelimit-limit-requests'),
      tokens: response.headers.get('x-ratelimit-limit-tokens'),
    };
    if (!response.ok)
      return {
        ...result,
        status: [401, 403].includes(response.status)
          ? 'auth_unavailable'
          : 'api_failed',
        reason: `HTTP_${response.status}`,
      };
    phase = 'invalid_output';
    const answer = await response.json();
    result.usage = answer.usage;
    if (answer.status !== 'completed')
      return {
        ...result,
        status: 'partial',
        reason: 'model_response_incomplete',
      };
    const output = JSON.parse(
      answer.output
        .filter((item) => item.type === 'message')
        .flatMap((item) => item.content)
        .filter((item) => item.type === 'output_text')
        .map((item) => item.text)
        .join(''),
    );
    if (
      !['completed', 'partial'].includes(output.status) ||
      !Array.isArray(output.findings) ||
      !Array.isArray(output.limitations) ||
      output.limitations.some((item) => typeof item !== 'string') ||
      !Array.isArray(output.rules_read)
    )
      throw new Error('invalid_output');
    const byPath = new Map(
      sources.map(({ path, content }) => [path, content.split('\n').length]),
    );
    // 형식이 어긋난 지적 하나 때문에 확인 가능한 나머지 지적까지 버리지 않는다. 버린 사실은 남긴다.
    const findings = output.findings.filter(
      (finding) =>
        typeof finding.rule === 'string' &&
        rules.some(({ path }) => finding.rule.startsWith(`${path}#`)) &&
        files.includes(finding.path) &&
        Number.isInteger(finding.line) &&
        finding.line >= 1 &&
        finding.line <= (byPath.get(finding.path) ?? 0) &&
        typeof finding.evidence === 'string' &&
        finding.evidence.trim() !== '' &&
        ['high', 'medium'].includes(finding.confidence),
    );
    if (findings.length !== output.findings.length)
      result.limitations.push(
        `형식이 어긋난 지적 ${output.findings.length - findings.length}건 제외 — 기준 경로·대상 파일·줄 번호를 확인할 수 없습니다.`,
      );
    const limitations = [...result.limitations, ...output.limitations];
    if (
      !rules.every(({ path }) => output.rules_read.includes(path)) ||
      output.rules_read.some((path) => !rulePaths.has(path))
    )
      return {
        ...result,
        status: 'partial',
        reason: 'criteria_read_unconfirmed',
        findings,
        limitations,
        rules_read: output.rules_read,
      };
    return {
      ...result,
      findings,
      limitations,
      rules_read: output.rules_read,
      status: limitations.length ? 'partial' : output.status,
    };
  } catch (error) {
    return {
      ...result,
      status: signal.aborted || Date.now() >= deadline ? 'timeout' : phase,
      reason: [
        'invalid_sha',
        'unsupported_file',
        'non_text_input',
        'input_limit',
        'invalid_output',
      ].includes(error.message)
        ? error.message
        : 'review_not_completed',
    };
  }
}

export function markdown(result) {
  const clean = (value) =>
    String(value)
      .replaceAll('@', '@\u200b')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  return (
    `## AI PR 리뷰 · advisory\n\n상태: **${result.status}**${result.reason ? ` (${result.reason})` : ''}\n\n` +
    `- base: \`${result.base}\`\n- head: \`${result.head}\`\n- merge-base: \`${result.mergeBase ?? '미수집'}\`\n- 기준: \`${result.rulesRef}\` · prompt: \`${result.promptHash ?? '미수집'}\`\n- 모델: \`${result.model}\` · 입력: ${result.inputBytes ?? 0} bytes\n\n` +
    (result.findings.length
      ? result.findings
          .map(
            (finding) =>
              `- **${clean(finding.path)}:${finding.line}** [${clean(finding.rule)} · ${finding.confidence}] ${clean(finding.evidence)}`,
          )
          .join('\n')
      : result.status === 'completed'
        ? '검토한 범위에서 지적 없음.'
        : '미실행·미완료 결과는 지적 없음으로 판정하지 않습니다.') +
    (result.limitations.length
      ? `\n\n미검토·질문:\n${result.limitations.map((item) => `- ${clean(item)}`).join('\n')}`
      : '') +
    `\n\n읽기 확인: ${result.rules_read.map(clean).join(', ') || '미확인'}\n\n최종 수용·반려는 작성자가 판단합니다.\n`
  );
}

export async function publishReview({
  token,
  repository,
  pr,
  comment,
  base,
  head,
  marker,
  body,
}) {
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !/^\d+$/.test(String(pr)) ||
    !/^\d+$/.test(String(comment))
  )
    throw new Error('invalid_publish_target');
  const api = async (path, options = {}) => {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/${path}`,
      {
        ...options,
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) throw new Error(`publish_failed_HTTP_${response.status}`);
    return response.json();
  };
  const current = await api(`pulls/${pr}`);
  const stale =
    current.state !== 'open' ||
    current.draft ||
    current.base.sha !== base ||
    current.head.sha !== head;
  // ponytail: 조회와 게시 사이의 push는 원자적으로 막을 수 없다. 댓글에 대상 SHA를 항상 남긴다.
  await api(`issues/comments/${comment}`, {
    method: 'PATCH',
    body: JSON.stringify({
      body: `${marker}\n${stale ? `AI review: superseded — 대상 head ${head} 또는 base가 변경되어 결과를 게시하지 않습니다.` : body}`,
    }),
  });
  return stale ? 'superseded' : 'published';
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes('--publish')) {
    let body;
    try {
      body = readFileSync('reports/ai-review.md', 'utf8');
    } catch {
      body = `AI review: incomplete — 리뷰 job ${process.env.REVIEW_RESULT}, 결과 파일 없음. 지적 없음으로 판정하지 않습니다.`;
    }
    const link = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}/attempts/${process.env.GITHUB_RUN_ATTEMPT}`;
    body += `\n\n[실행 기록](${link}) · 실행 코드: \`${process.env.GITHUB_WORKFLOW_SHA}\``;
    try {
      const status = await publishReview({
        token: process.env.GH_TOKEN,
        repository: process.env.GITHUB_REPOSITORY,
        pr: process.env.PR_NUMBER,
        comment: process.env.COMMENT_ID,
        base: process.env.BASE_SHA,
        head: process.env.HEAD_SHA,
        marker: process.env.COMMENT_MARKER,
        body,
      });
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `AI review: ${status}\n`,
        );
    } catch {
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `AI review: publish_failed\n\n${body}`,
        );
      process.exitCode = 1;
    }
  } else {
    const result = await review({
      base: process.env.BASE_SHA,
      head: process.env.HEAD_SHA,
      rulesRef: process.env.RULES_SHA || process.env.BASE_SHA,
      apiKey: process.env.OPENAI_API_KEY,
      prepareOnly: process.argv.includes('--prepare'),
      promptFile: process.env.REVIEW_PROMPT_FILE || '',
    });
    const output = process.env.REVIEW_OUTPUT || 'reports/ai-review';
    // 출력 디렉터리는 호출자가 준비한다. PR 파일이 출력 위치를 지정하지 않는다.
    writeFileSync(`${output}.json`, JSON.stringify(result, null, 2));
    writeFileSync(`${output}.md`, markdown(result));
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown(result));
    console.log(`AI review: ${result.status}`);
    if (!['completed', 'prepared', 'skipped'].includes(result.status))
      process.exitCode = 1;
  }
}
