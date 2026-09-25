import { expect, test } from "@playwright/test";

test("production build serves the starter web baseline", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Commerce" })).toBeVisible();

  const products = await request.get("/api/products");
  expect(products.ok()).toBe(true);
  const payload = await products.json();
  expect(payload.products.length).toBeGreaterThan(0);
});

test("grader-only session minting is closed on the public starter", async ({ request }) => {
  const response = await request.post("/api/__dlc/session", {
    data: { account: "customer-a", signingApp: "web", audience: "web" },
    headers: { "x-dlc-grader-token": "not-a-real-token" },
  });

  expect([403, 404]).toContain(response.status());
});
