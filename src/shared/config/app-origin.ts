// 서버가 자기 자신(API·metadataBase)을 가리킬 때 쓰는 절대 origin 의 단일 출처.
// Preview 는 배포마다 주소가 달라 고정값을 둘 수 없으므로 Vercel 이 주입하는 자기 주소(VERCEL_URL)로 유도한다 —
// production 주소를 넣어 Preview 가 production API 를 읽는 사고를 구조적으로 막는다. Production 은 APP_ORIGIN 을 명시한다
export const resolveAppOrigin = (env: Record<string, string | undefined>) =>
  env.APP_ORIGIN ?? (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");

export const APP_ORIGIN = resolveAppOrigin(process.env);
