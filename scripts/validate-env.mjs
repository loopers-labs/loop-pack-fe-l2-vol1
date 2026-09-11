import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEV_SESSION_SECRET = "loopers-week09-secret";
const MIN_SECRET_LENGTH = 32;
const PUBLIC_PREFIX = "NEXT_PUBLIC_";
const PUBLIC_ALLOWLIST = new Set();
const PLATFORM_PUBLIC_PREFIX = "NEXT_PUBLIC_VERCEL_";
const SECRET_LIKE =
  /(SECRET|TOKEN|KEY|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|SESSION|SIGNATURE|DSN|WEBHOOK)/i;
const REQUIRED = ["APP_ORIGIN", "AUTH_SESSION_SECRET"];
// 값 복사 검사는 우리가 소유한 비밀값만 본다 — 플랫폼 변수(TURBO_CI_VENDOR_ENV_KEY="VERCEL_" 등)를 넣으면
// 커밋 메시지 같은 공개 값에 우연히 포함되어 오탐이 난다 (첫 Vercel 빌드에서 실제로 발생)
const OWNED_SECRETS = ["AUTH_SESSION_SECRET"];

const redact = (value) => `«redacted, ${value.length} chars»`;
const shown = (value) => (value.length > 60 ? `${value.slice(0, 60)}…` : value);
const parseUrl = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/** @param {Record<string, string | undefined>} env */
export const isDeployLike = (env) =>
  Boolean(env.VERCEL_ENV) || env.NODE_ENV === "production" || env.CI === "true";

/** @param {Record<string, string | undefined>} env */
export const validateEnv = (env) => {
  /** @type {{ level: "error" | "warn"; variable: string; rule: string; seen: string; fix: string }[]} */
  const findings = [];
  const strict = isDeployLike(env);
  const fail = (variable, rule, seen, fix) =>
    findings.push({ level: "error", variable, rule, seen, fix });
  const warn = (variable, rule, seen, fix) =>
    findings.push({ level: "warn", variable, rule, seen, fix });

  const derivedOrigin =
    env.VERCEL_URL && env.VERCEL_ENV !== "production" ? `https://${env.VERCEL_URL}` : null;
  for (const name of REQUIRED) {
    if (env[name]) continue;
    if (name === "APP_ORIGIN" && derivedOrigin) {
      warn(name, "derived", derivedOrigin, "Preview 는 배포 자기 주소(VERCEL_URL)로 유도한다");
      continue;
    }
    (strict ? fail : warn)(
      name,
      "required",
      "(unset)",
      strict ? "배포·CI 환경에서는 반드시 설정한다" : "로컬 기본값을 쓰고 있다",
    );
  }

  const secret = env.AUTH_SESSION_SECRET;
  if (secret && strict) {
    if (secret === DEV_SESSION_SECRET) {
      fail(
        "AUTH_SESSION_SECRET",
        "dev-fallback",
        redact(secret),
        "코드에 있는 개발용 값은 배포에 쓸 수 없다 — `openssl rand -hex 32` 로 생성",
      );
    } else if (secret.length < MIN_SECRET_LENGTH) {
      fail(
        "AUTH_SESSION_SECRET",
        "too-short",
        redact(secret),
        `${MIN_SECRET_LENGTH}자 이상이어야 한다`,
      );
    }
  }

  const origin = env.APP_ORIGIN;
  if (origin) {
    const url = parseUrl(origin);
    if (!url) {
      fail(
        "APP_ORIGIN",
        "invalid-url",
        shown(origin),
        "`https://host` 형태의 절대 origin 을 넣는다",
      );
    } else {
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        fail("APP_ORIGIN", "protocol", shown(origin), "http 또는 https 만 허용한다");
      }
      if (url.pathname !== "/" || url.search || url.hash || origin.endsWith("/")) {
        fail(
          "APP_ORIGIN",
          "origin-only",
          shown(origin),
          "경로·쿼리·끝 슬래시 없이 origin 만 넣는다",
        );
      }
      if (env.VERCEL_ENV === "production" && url.protocol !== "https:") {
        fail("APP_ORIGIN", "https-required", shown(origin), "production 은 https 여야 한다");
      }
      const productionHost = env.VERCEL_PROJECT_PRODUCTION_URL;
      if (
        env.VERCEL_ENV &&
        env.VERCEL_ENV !== "production" &&
        productionHost &&
        url.host === productionHost
      ) {
        fail(
          "APP_ORIGIN",
          "preview-points-to-production",
          shown(origin),
          `${env.VERCEL_ENV} 환경이 production origin 을 바라본다 — VERCEL_URL 계열 값을 쓴다`,
        );
      }
    }
  }

  const privateSecrets = OWNED_SECRETS.map((name) => [name, env[name]]).filter(
    ([, value]) => value && value.length >= 8,
  );
  for (const [name, value = ""] of Object.entries(env)) {
    if (!name.startsWith(PUBLIC_PREFIX)) continue;
    if (SECRET_LIKE.test(name.slice(PUBLIC_PREFIX.length))) {
      fail(name, "public-secret-name", redact(value), "접두사를 떼고 서버에서만 읽는다");
    }
    for (const [secretName, secretValue] of privateSecrets) {
      if (secretValue && value.includes(secretValue)) {
        fail(
          name,
          "public-secret-value",
          redact(value),
          `${secretName} 의 값이 브라우저 번들에 들어간다`,
        );
      }
    }
    if (!PUBLIC_ALLOWLIST.has(name) && !name.startsWith(PLATFORM_PUBLIC_PREFIX)) {
      warn(
        name,
        "unknown-public",
        shown(value),
        "scripts/validate-env.mjs 의 허용 목록에 등록하거나 제거한다",
      );
    }
  }

  return { strict, findings, errors: findings.filter((finding) => finding.level === "error") };
};

const renderMarkdown = ({ strict, findings, errors }) => {
  const warnings = findings.length - errors.length;
  const title = errors.length > 0 ? "## ❌ 환경 변수 검증 실패" : "## ✅ 환경 변수 검증 통과";
  const mode = `모드: ${strict ? "strict (CI·배포)" : "local"} · 필수 ${REQUIRED.join(", ")}`;
  const rows = findings.map(
    ({ level, variable, rule, seen, fix }) =>
      `| ${level === "error" ? "❌" : "⚠️"} | \`${variable}\` | ${rule} | \`${seen}\` | ${fix} |`,
  );
  const table =
    rows.length > 0
      ? ["| | 변수 | 규칙 | 확인된 값 | 조치 |", "| --- | --- | --- | --- | --- |", ...rows].join(
          "\n",
        )
      : "_지적 없음_";
  const outcome = errors.length > 0 ? "build 를 시작하지 않는다" : "build 를 진행한다";
  const verdict = `**${errors.length} error, ${warnings} warning** — ${outcome}`;
  return [title, "", mode, "", table, "", verdict, ""].join("\n");
};

const main = () => {
  const result = validateEnv(process.env);
  const markdown = renderMarkdown(result);
  process.stdout.write(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  if (process.env.GITHUB_ACTIONS) {
    for (const { variable, rule, fix } of result.errors) {
      process.stdout.write(`::error title=validate-env ${variable}::${rule} — ${fix}\n`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
