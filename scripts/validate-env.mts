// 배포 사고는 코드보다 설정에서 난다. build 전에 결정적으로 막는다.
//
// ── 왜 이 게이트가 필요한가 (이 레포의 실제 약점) ───────────────────────────
// ① `AUTH_SESSION_SECRET`에 하드코딩 기본값이 있다(`"loopers-week09-secret"`).
//    배포에서 변수가 빠지면 **오류 없이** 세션 HMAC 비밀이 공개 문자열이 된다.
//    쿠키는 정상으로 보이고 로그인도 되므로 아무도 모른다.
// ② `APP_ORIGIN`은 `requireAppOrigin()`이 던지지만, 그건 **그 함수를 부를 때**다.
//    빠진 것을 build 전에 알면 파이프라인이 더 일찍, 더 싸게 멈춘다.
// ③ Preview가 production API를 보면 테스트 주문이 실 데이터에 쌓인다. origin이
//    어디를 가리키는지 **형태로** 확인한다.
//
// ── 무엇을 검사하지 않는가 ──────────────────────────────────────────────────
// 값이 "맞는지"는 검사하지 않는다(그 주소가 살아 있는지, 비밀이 진짜 비밀인지).
// 그건 결정적으로 판별할 수 없다. **형태와 존재만** 본다 — 게이트는 결정적인
// 것만 맡는다는 10주차 기준 그대로다.
import { appendFileSync } from "node:fs";

// auth.ts가 쓰는 기본값. 이 값이 그대로 배포되면 비밀이 아니다.
const KNOWN_DEFAULT_SECRET = "loopers-week09-secret";
const MIN_SECRET_LENGTH = 32;

// 이름에 이게 들어 있으면 브라우저로 내보내면 안 되는 값으로 본다.
const SECRET_NAME_PATTERN = /SECRET|TOKEN|PASSWORD|CREDENTIAL|PRIVATE|_KEY$|APIKEY/i;

type Finding = { level: "error" | "warn"; name: string; message: string };

const findings: Finding[] = [];
const fail = (name: string, message: string) => findings.push({ level: "error", name, message });
const warn = (name: string, message: string) => findings.push({ level: "warn", name, message });

// `--production`을 주면 배포 기준으로 본다. CI의 build 검증은 기본 모드로 돈다 —
// 코스가 제공한 파이프라인이 env를 주지 않으므로, 여기서 강하게 막으면 build 자체가
// 못 돈다(7주차에 같은 이유로 metadataOrigin에 기본값을 남겼다).
const isProduction = process.argv.includes("--production");

// ── APP_ORIGIN ──────────────────────────────────────────────────────────────
const appOrigin = process.env.APP_ORIGIN;

if (appOrigin === undefined || appOrigin === "") {
  const message =
    "서버가 자기 Route Handler를 부를 절대 주소가 없습니다. build와 runtime에 같은 값을 넣으세요(예: http://localhost:3000).";
  if (isProduction) {
    fail("APP_ORIGIN", message);
  } else {
    warn("APP_ORIGIN", `${message} (배포에서는 실패로 막힙니다)`);
  }
} else {
  let parsed: URL | undefined;
  try {
    parsed = new URL(appOrigin);
  } catch {
    fail("APP_ORIGIN", "절대 URL이 아닙니다(스킴을 포함한 origin을 넣으세요).");
  }

  if (parsed !== undefined) {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      fail("APP_ORIGIN", `http·https만 허용합니다(받은 스킴: ${parsed.protocol}).`);
    }
    // ⚠️ 값 원문을 찍지 않는다. 잘못 넣은 값에 비밀이 섞여 있을 수 있다 —
    // 실측으로 `https://host/?token=…` 을 넣으면 그 토큰이 보고서와 step summary에
    // 그대로 남았다(Codex 교차 검증에서 나온 자리다).
    // "정상 origin은 공개 정보"라는 사실은 **검증에 실패한 입력에도 비밀이 없다**는
    // 근거가 되지 않는다. 종류만 말하고 값은 말하지 않는다.
    if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
      const parts = [
        parsed.pathname !== "/" ? "경로" : undefined,
        parsed.search !== "" ? "쿼리" : undefined,
        parsed.hash !== "" ? "프래그먼트" : undefined,
      ].filter((part) => part !== undefined);
      fail("APP_ORIGIN", `origin만 넣으세요 — ${parts.join("·")}가 붙어 있습니다.`);
    }
    // 자격 증명이 박힌 URL은 Node의 Request가 거부한다. 형태로 막을 수 있다.
    if (parsed.username !== "" || parsed.password !== "") {
      fail(
        "APP_ORIGIN",
        "URL에 자격 증명(user:pass@)이 들어 있습니다. Node의 Request가 거부하고, 값이 로그에 남습니다.",
      );
    }
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname.endsWith(".local");
    if (isProduction) {
      if (isLocal) {
        fail(
          "APP_ORIGIN",
          `배포인데 로컬 호스트(${parsed.hostname})를 가리킵니다. 서버가 자기 자신을 못 찾습니다.`,
        );
      }
      if (parsed.protocol === "http:") {
        fail("APP_ORIGIN", "배포에서는 https를 쓰세요.");
      }
    }
  }
}

// ── AUTH_SESSION_SECRET ─────────────────────────────────────────────────────
// 이 레포에서 가장 조용히 터질 자리다.
const sessionSecret = process.env.AUTH_SESSION_SECRET;

if (sessionSecret === undefined || sessionSecret === "") {
  const message =
    "세션 쿠키를 서명할 비밀이 없습니다. auth.ts의 하드코딩 기본값이 쓰이고, 그러면 누구나 세션을 위조할 수 있는데 화면은 정상으로 보입니다.";
  if (isProduction) {
    fail("AUTH_SESSION_SECRET", message);
  } else {
    warn("AUTH_SESSION_SECRET", `${message} (배포에서는 실패로 막힙니다)`);
  }
} else {
  if (sessionSecret === KNOWN_DEFAULT_SECRET) {
    // 기본값을 **명시적으로 넣은** 경우다. 개발에서도 막는다 — 이 값은 레포에 적혀 있다.
    fail("AUTH_SESSION_SECRET", "레포에 적혀 있는 기본값과 같습니다. 비밀이 아닙니다.");
  }
  if (isProduction && sessionSecret.length < MIN_SECRET_LENGTH) {
    fail(
      "AUTH_SESSION_SECRET",
      `너무 짧습니다(${sessionSecret.length}자). HMAC 키는 ${MIN_SECRET_LENGTH}자 이상으로 두세요.`,
    );
  }
}

// ── NEXT_PUBLIC_ 접두어가 붙은 비밀 ─────────────────────────────────────────
// Next는 `NEXT_PUBLIC_*`를 **빌드 결과에 인라인**한다. 즉 브라우저에서 읽힌다.
// 이름만 보고 판정하므로 오탐이 있을 수 있지만, 이 방향의 오탐은 싸다 —
// 잘못 걸리면 이름을 바꾸면 되고, 놓치면 비밀이 공개된다.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && SECRET_NAME_PATTERN.test(name)) {
    fail(
      name,
      "NEXT_PUBLIC_ 접두어가 붙으면 빌드 결과에 인라인되어 브라우저에서 읽힙니다. 비밀로 보이는 이름입니다 — 접두어를 떼고 서버에서만 읽으세요.",
    );
  }
}

// ── 보고 ────────────────────────────────────────────────────────────────────
// 값은 절대 찍지 않는다(로그가 남는다). 이름과 이유만 적는다.
// 위 검사들도 값을 메시지에 넣지 않았다 — APP_ORIGIN만 예외인데, 그건 비밀이 아니다.
const errors = findings.filter((finding) => finding.level === "error");
const warns = findings.filter((finding) => finding.level === "warn");
const mode = isProduction ? "배포(--production)" : "개발·CI";

const lines: string[] = [`## 환경 변수 검증 — ${mode}`, ""];

if (findings.length === 0) {
  lines.push(
    "통과. 검사한 것: `APP_ORIGIN` 존재·형태, `AUTH_SESSION_SECRET` 존재·기본값·길이, `NEXT_PUBLIC_` 비밀 노출.",
  );
} else {
  if (errors.length > 0) {
    lines.push(`### 실패 ${errors.length}건`, "");
    lines.push("| 변수 | 왜 막았나 |", "| --- | --- |");
    for (const finding of errors) {
      lines.push(`| \`${finding.name}\` | ${finding.message} |`);
    }
    lines.push("");
  }
  if (warns.length > 0) {
    lines.push(`### 경고 ${warns.length}건 (지금은 막지 않습니다)`, "");
    lines.push("| 변수 | 내용 |", "| --- | --- |");
    for (const finding of warns) {
      lines.push(`| \`${finding.name}\` | ${finding.message} |`);
    }
  }
}

const report = lines.join("\n");
// PR 화면에서 보이게 한다. 로그를 열어봐야 알면 실무에서 안 본다.
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath !== undefined && summaryPath !== "") {
  appendFileSync(summaryPath, `${report}\n\n`);
}

console.warn(report);

if (errors.length > 0) {
  process.exitCode = 1;
}
