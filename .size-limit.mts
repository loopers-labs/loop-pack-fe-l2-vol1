import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";

// 라우트별 First Load JS 예산. Next 16(Turbopack)은 build 출력에 First Load JS를 찍지 않아
// 매니페스트에서 직접 조립한다 — 공통 청크(rootMainFiles) + 그 라우트의 클라이언트 청크.
// size-limit은 파일 경로만 재므로, 해시가 붙은 청크 목록을 빌드 뒤 여기서 읽어 entry로 만든다.
// 그래서 `pnpm build` 뒤에만 의미 있는 결과가 나온다.
//
// 한도는 절대 목표가 아니라 회귀 게이트다 — 7주차 측정에서 LCP를 지배한 건 이미지 전송이지 JS가 아니라,
// "이 바이트 밑이어야 UX가 지켜진다"는 절대선을 세울 근거가 우리 측정엔 없다.
// 한도 = 측정값(gzip, kB) + 여유폭. 측정값을 그대로 두고 한도를 계산해, "지금 얼마인데 왜 이 숫자인가"가
// 코드에 남게 한다. 측정값이 바뀌면(정당한 성장) 그 숫자만 갱신하고, 커밋에 이유를 적는다 —
// CI는 커밋된 숫자와 비교만 한다.
//
// 여유폭 10 kB의 근거: 7주차 After(e7d0c2b) → 측정 시점까지 두 주치 정상 성장이 라우트당 약 +5 kB라 그 두 배이고,
// 무심코 들어오는 라이브러리 하나보다 작다(실측: TanStack devtools 패널을 홈에 실으면 +15.6 kB).
// 즉 정상 작업은 통과하고 사고는 걸린다. 수치 근거는 docs/rfc/week10-ci.md 3단계.
const HEADROOM_KB = 10;

type RouteBudget = { route: string; measuredKb: number };

// 사용자가 처음 내려받는 진입 화면과 구매 경로의 화면만 잰다. measuredKb는 size-limit이 낸 gzip 값.
// 같은 소스라도 빌드마다 ±0.5 kB쯤 흔들린다(청크 해시·env 인라인). 여유폭이 그 흔들림을 흡수한다.
const ROUTE_BUDGETS: RouteBudget[] = [
  { route: "(commerce)/page", measuredKb: 246.3 },
  { route: "(commerce)/products/page", measuredKb: 249.8 },
  { route: "(commerce)/cart/page", measuredKb: 235.9 },
  { route: "(commerce)/order-form/page", measuredKb: 239.7 },
  { route: "(commerce)/orders/page", measuredKb: 239.4 },
  { route: "(commerce)/login/page", measuredKb: 236.2 },
];

// build-manifest의 polyfillFiles는 일부러 뺀다. <script nomodule>로 실리는 core-js 폴리필이라
// ES 모듈을 아는 브라우저는 내려받지 않는다 — 실제 HTML의 script 태그와 대조해 이 청크 하나만 차이 남을 확인했다.
function readSharedChunks(): string[] {
  const manifestPath = ".next/build-manifest.json";
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath}가 없습니다. 먼저 pnpm build를 실행하세요.`);
  }
  // 빌드 산출물은 I/O 경계다. Next가 필드를 바꾸면 undefined가 조용히 흐르지 않고 여기서 멈추게 검증한다.
  return z
    .object({ rootMainFiles: z.array(z.string()).min(1) })
    .parse(JSON.parse(readFileSync(manifestPath, "utf8"))).rootMainFiles;
}

function readRouteChunks(route: string): string[] {
  const manifestPath = `.next/server/app/${route}_client-reference-manifest.js`;
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath}가 없습니다. 먼저 pnpm build를 실행하세요.`);
  }
  const source = readFileSync(manifestPath, "utf8");
  const chunks = [...new Set(source.match(/static\/chunks\/[^"\\]+\.js/g) ?? [])];
  // 이 앱의 모든 라우트는 클라이언트 청크를 갖는다. 0건이면 매니페스트 형식이 바뀐 것이고,
  // 그대로 두면 공통 청크만 재서 예산이 조용히 통과한다.
  if (chunks.length === 0) {
    throw new Error(
      `${manifestPath}에서 청크를 찾지 못했습니다. 매니페스트 형식이 바뀌었는지 확인하세요.`,
    );
  }
  return chunks;
}

const sharedChunks = readSharedChunks();

// gzip으로 잰다 — 7주차 이후의 모든 측정(HAR·수동 집계)이 gzip 기준이라 같은 잣대를 유지한다.
export default ROUTE_BUDGETS.map(({ route, measuredKb }) => ({
  name: `${route.replace("(commerce)", "").replace(/\/page$/, "") || "/"} first load`,
  path: [...new Set([...sharedChunks, ...readRouteChunks(route)])].map((chunk) => `.next/${chunk}`),
  limit: `${Math.ceil(measuredKb + HEADROOM_KB)} kB`,
  gzip: true,
}));
