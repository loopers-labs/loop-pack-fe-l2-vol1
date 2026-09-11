import { setupServer } from "msw/node";

import { handlers } from "@/test/handlers";

// 통합 테스트용 MSW 서버. 앱 코드의 fetch를 직접 바꿔치기하지 않고,
// 실제로 나가는 요청을 이 서버가 네트워크 경계에서 가로챈다.
export const server = setupServer(...handlers);
