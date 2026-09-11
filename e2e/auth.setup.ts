import { expect, test as setup } from "@playwright/test";
import { authAccount, authStateCount, authStatePath } from "./authState";

setup("워커별 로그인 상태를 storageState 파일로 저장한다", async ({ request }) => {
  for (let index = 0; index < authStateCount; index += 1) {
    const response = await request.post("/api/auth/login", {
      data: authAccount(index),
    });

    expect(response.ok()).toBe(true);
    await request.storageState({ path: authStatePath(index) });
  }
});
