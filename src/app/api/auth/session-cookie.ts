// mock 백엔드가 밖으로 공개하는 세션 쿠키 계약. Edge 런타임(proxy)에서도 import 할 수 있게 상수만 둔다
export { SCENARIO_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/app/api/_data/auth-cookies";
