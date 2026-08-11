import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// onUnhandledRequest:"error" — 모킹되지 않은 요청이 조용히 나가면 즉시 실패시킨다.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// 테스트가 추가한 server.use() override 를 초기화해 다음 테스트로 새지 않게 한다.
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
