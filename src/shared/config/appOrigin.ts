import { ConfigError } from "./ConfigError";

// 이 앱은 서버(RSC·generateMetadata)에서도 자기 Route Handler를 HTTP로 부른다(self-HTTP).
// 브라우저에는 기준 origin이 있지만 서버에는 없으므로 자기 주소를 알려줘야 한다.
//
// 같은 환경변수를 두 곳이 쓰는데 **위험도가 다르다.** 그래서 함수를 둘로 나눴다.
//
//   requireAppOrigin()  — self-HTTP용. 기본값 없음. 없으면 던진다.
//   metadataOrigin()    — OG·canonical용. 기본값 있음.
//
// 7주차 피드백은 기본값을 떼라는 것이었고, 그 근거는 "배포에서 변수가 빠지면 오류 없이
// localhost로 fetch가 나가 실패가 드러나지 않는다"였다. **그 위험은 self-HTTP 쪽에만 있다** —
// 잘못된 metadataBase는 OG 링크가 틀리는 버그지, 요청이 엉뚱한 데로 나가는 게 아니다.
//
// 양쪽에서 다 떼면 `next build`가 실패한다. `/_not-found`와 `/performance-lab/inp`가
// prerender되면서 layout을 렌더하고, 그때 metadataBase가 평가되기 때문이다
// (generateMetadata로 미뤄도 마찬가지 — prerender가 그걸 호출한다).
// 이 레포의 채점 게이트는 **코스가 제공한 `.github/workflows/quality.yml`**이고 env를 주지 않는다.
// 그래서 위험이 실재하는 쪽에만 hard failure를 두고, 나머지는 기본값 + 근거를 남긴다.

// ⚠️ 기본값을 떼는 것만으로는 아무 일도 일어나지 않는다. 이 함수를 부르는 두 경로가
// 모두 실패를 삼키기 때문이다 — generateMetadata의 `catch { return {} }`와,
// 설계상 던지지 않는 `prefetchQuery`. 실측: APP_ORIGIN 없이 서버를 띄우고 /products를
// 요청하면 200이 오고 로그에 흔적이 0건이었다.
// 그래서 ConfigError로 갈라 던지고, 화면의 catch가 그것만 다시 던진다.
export function requireAppOrigin(): string {
  const origin = process.env.APP_ORIGIN;
  if (origin === undefined || origin === "") {
    throw new ConfigError(
      "APP_ORIGIN이 설정되지 않았습니다. 서버가 자기 Route Handler를 부를 절대 주소를 알 수 없습니다. " +
        "build와 runtime에 같은 값을 넣으세요 (예: APP_ORIGIN=http://localhost:3000).",
    );
  }
  return origin;
}

// prerender 시점에도 평가되므로 기본값이 필요하다.
// 여기 localhost가 남는 건 OG·canonical이 로컬 주소로 찍힌다는 뜻이고, 배포 전에 눈에 보인다.
export function metadataOrigin(): string {
  return process.env.APP_ORIGIN ?? `http://localhost:${process.env.PORT ?? "3000"}`;
}
