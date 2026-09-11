import { z } from "zod";

// 배포 사고는 코드보다 설정에서 난다. 빌드가 그 값을 쓰기 전에 결정적으로 거른다.
// 값의 형태(URL·길이)는 zod가, 값 사이의 관계(같은 origin·컨텍스트별 금지)는 아래 규칙이 본다.
//
// 어디서 도나: next.config.ts가 빌드 시작 시 부르고(로컬·배포 빌드 공통), CI는 빌드 앞의 이름 붙은 step에서
// validate-env.mts(CLI)로 한 번 더 부른다. 두 번 부르는 건 CI에서 "어느 게이트가 빨간지"가 step 이름으로
// 보이게 하려는 것이고, 규칙은 이 파일 한 벌이다.
//
// 배포 컨텍스트 판별은 VERCEL_ENV로만 한다. `next build`는 항상 NODE_ENV=production이라 그걸로는
// CI 빌드와 실배포를 가를 수 없다.

// origin 형태(스킴://호스트[:포트])만 허용한다. 경로·쿼리·끝 슬래시가 붙으면 `${APP_ORIGIN}${path}`로
// 이어 붙일 때 URL이 깨진다. zod는 url 검사가 실패해도 refine을 이어서 돌리므로, 파싱 가능한 값에만 비교를 건다.
const originSchema = z
  .url({ protocol: /^https?$/ })
  .refine(
    (value) => URL.canParse(value) && new URL(value).origin === value,
    "origin 형태(스킴://호스트[:포트])여야 합니다. 경로·쿼리·끝 슬래시·대문자 호스트·기본 포트(:80/:443) 표기는 안 됩니다",
  );

// 이름에 이 단어가 들어간 값은 비밀로 본다. NEXT_PUBLIC_이 붙으면 브라우저 번들에 그대로 박혀 누구나 읽는다.
// 이름 수준 검사라 순진한 이름의 비밀은 못 잡고, 공개용 키(지도 API 키 등)는 오탐이 난다 —
// 조용히 새는 쪽보다 시끄럽게 막히는 쪽을 골랐고, 그 한계는 문서에 적는다.
const SECRET_LIKE_NAME = /SECRET|TOKEN|PASSWORD|PRIVATE|KEY/;

// 세션 서명은 HMAC-SHA256이다(auth.ts). RFC 2104는 HMAC 키를 해시 출력 길이 이상으로 권고하고,
// SHA-256의 출력은 32바이트다. 그보다 짧은 키는 그만큼 엔트로피가 깎인다.
const MIN_SESSION_SECRET_BYTES = 32;

type EnvProblem = { name: string; problem: string };

// process.env 모양이면 된다. NodeJS.ProcessEnv는 Next 타입이 NODE_ENV를 필수로 넓혀 테스트 입력이 번거롭다.
type EnvLike = Record<string, string | undefined>;

// 빈 문자열은 셸에서 `VAR=`로 지운 것과 같다. 미설정으로 본다.
const isSet = (value: string | undefined): value is string => value !== undefined && value !== "";

export function validateEnv(env: EnvLike): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const isCi = isSet(env.CI);
  const isDeploy = isSet(env.VERCEL_ENV);
  const isProduction = env.VERCEL_ENV === "production";

  const appOrigin = originSchema.safeParse(env.APP_ORIGIN);
  if (!appOrigin.success) {
    problems.push({
      name: "APP_ORIGIN",
      problem: describeOriginFailure(env.APP_ORIGIN, appOrigin.error),
    });
  }

  const baseUrl = originSchema.safeParse(env.NEXT_PUBLIC_BASE_URL);
  if (!baseUrl.success) {
    problems.push({
      name: "NEXT_PUBLIC_BASE_URL",
      problem: describeOriginFailure(env.NEXT_PUBLIC_BASE_URL, baseUrl.error),
    });
  }

  // 서버(self-fetch·metadataBase)와 브라우저 번들이 같은 origin을 봐야 서버 prefetch와 클라 요청의 query key가 일치한다.
  if (appOrigin.success && baseUrl.success && appOrigin.data !== baseUrl.data) {
    problems.push({
      name: "NEXT_PUBLIC_BASE_URL",
      problem: `APP_ORIGIN(${appOrigin.data})과 같아야 합니다. 지금은 ${baseUrl.data}`,
    });
  }

  // 측정 전용 플래그(build:slow)다. CI·배포 빌드에 남아 있으면 느린·실패하는 mock이 실서비스에 실린다.
  if ((isCi || isDeploy) && isSet(env.NEXT_PUBLIC_MOCK_SCENARIO)) {
    problems.push({
      name: "NEXT_PUBLIC_MOCK_SCENARIO",
      problem: `CI·배포 빌드에서는 설정하면 안 됩니다. 지금은 "${env.NEXT_PUBLIC_MOCK_SCENARIO}"`,
    });
  }

  // 미설정이면 코드의 기본값(mock용)이 세션 서명에 쓰인다. 실배포에서 그러면 누구나 세션을 위조한다.
  // preview는 요구하지 않는다 — 이 백엔드는 mock이라 preview 세션을 위조해도 얻는 게 없고,
  // preview마다 시크릿을 요구하면 실험 배포가 매번 막힌다. 실데이터가 붙는 순간 isDeploy로 넓혀야 한다.
  if (isProduction) {
    const secretBytes = Buffer.byteLength(env.AUTH_SESSION_SECRET ?? "");
    if (secretBytes < MIN_SESSION_SECRET_BYTES) {
      problems.push({
        name: "AUTH_SESSION_SECRET",
        problem: `production에서는 ${MIN_SESSION_SECRET_BYTES}바이트 이상으로 설정해야 합니다(기본값 금지). 지금은 ${secretBytes}바이트`,
      });
    }
  }

  // Vercel은 production 빌드에 자기 production 도메인(VERCEL_PROJECT_PRODUCTION_URL)을 넣어준다.
  // APP_ORIGIN이 그 도메인이 아니면 서버가 남의 origin으로 self-fetch하고 OG URL도 남의 사이트를 가리킨다 —
  // 같은 이름의 vercel.app이 남의 것이었던 첫 배포에서 실제로 났던 사고다. APP_ORIGIN·NEXT_PUBLIC_BASE_URL의
  // 형태·일치 검사는 "내 origin인가"를 보지 않아 이걸 통과시킨다.
  // Vercel은 https만 서빙하므로 호스트가 아니라 origin 전체(https://도메인)를 비교한다 — 스킴·포트 오기도 잡힌다.
  // 전제: 이 변수는 Vercel 프로젝트 설정 "Automatically expose System Environment Variables"(기본 켜짐)가
  // 켜져 있을 때만 주입된다. 꺼져 있으면 VERCEL_ENV도 없어 이 규칙과 production 시크릿 규칙 모두 개입하지 않는다.
  if (isProduction && isSet(env.VERCEL_PROJECT_PRODUCTION_URL) && appOrigin.success) {
    const expectedOrigin = `https://${env.VERCEL_PROJECT_PRODUCTION_URL.toLowerCase()}`;
    if (appOrigin.data !== expectedOrigin) {
      problems.push({
        name: "APP_ORIGIN",
        problem: `production origin(${expectedOrigin})과 다릅니다. 지금은 ${appOrigin.data} — 남의 origin으로 self-fetch하게 됩니다`,
      });
    }
  }

  for (const name of Object.keys(env)) {
    if (
      name.startsWith("NEXT_PUBLIC_") &&
      SECRET_LIKE_NAME.test(name.slice("NEXT_PUBLIC_".length))
    ) {
      problems.push({
        name,
        problem:
          "비밀로 보이는 값에 NEXT_PUBLIC_이 붙어 브라우저 번들에 노출됩니다. 서버 전용 이름으로 바꾸세요",
      });
    }
  }

  return problems;
}

function describeOriginFailure(value: string | undefined, error: z.ZodError): string {
  if (!isSet(value)) {
    return "설정되지 않았습니다";
  }
  return `${error.issues[0]?.message ?? "형식이 맞지 않습니다"}. 지금은 "${value}"`;
}

export function formatProblems(problems: EnvProblem[]): string {
  // 값에 `|`가 들어오면(잘못 설정된 URL 등) 표의 열이 밀린다. 표 문법만 이스케이프한다.
  const cell = (text: string) => text.replaceAll("|", "\\|");
  const rows = problems
    .map(({ name, problem }) => `| \`${cell(name)}\` | ${cell(problem)} |`)
    .join("\n");
  return `## 환경 변수 검증 실패 (${problems.length}건)\n\n| 변수 | 문제 |\n| --- | --- |\n${rows}\n`;
}
