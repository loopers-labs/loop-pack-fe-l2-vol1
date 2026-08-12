import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// 앱 코드의 fetch를 바꿔치기하지 않는다. 요청은 실제로 나가고 여기서 가로챈다.
export const server = setupServer(...handlers);
