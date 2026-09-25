import { spawn } from "node:child_process";
import net from "node:net";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createCommerceApi } from "../services/commerce-api/app.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitUntilReady(url, child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js starter가 준비되기 전에 종료했습니다: ${child.exitCode}`);
    }
    try {
      // Health proves the Next.js process is serving. Readiness intentionally
      // includes the external commerce service, which this isolated runtime
      // contract does not require.
      const response = await fetch(`${url}/api/dlc/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The production server may still be binding its socket.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Next.js starter health가 30초 안에 성공하지 않았습니다.");
}

const port = await reservePort();
const baseUrl = `http://127.0.0.1:${port}`;
const graderToken = "dlc-local-runtime-token";
const commerceToken = "dlc-local-commerce-token";
const mentorAdminToken = "dlc-local-mentor-admin-token";
const barrierArrivalToken = "dlc-local-barrier-arrival-token";
const mentor = createCommerceApi({
  internalToken: commerceToken,
  graderToken: mentorAdminToken,
  barrierArrivalToken,
});
await new Promise((resolve, reject) => {
  mentor.server.once("error", reject);
  mentor.server.listen(0, "127.0.0.1", resolve);
});
const mentorAddress = mentor.server.address();
const mentorBaseUrl = `http://127.0.0.1:${mentorAddress.port}`;
const server = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    DLC_GRADER_ENABLED: "true",
    DLC_GRADER_TOKEN: graderToken,
    WEB_SESSION_SECRET: "dlc-local-web-secret",
    ADMIN_SESSION_SECRET: "dlc-local-admin-secret",
    COMMERCE_API_URL: mentorBaseUrl,
    COMMERCE_API_TOKEN: commerceToken,
    DLC_BARRIER_URL: mentorBaseUrl,
    DLC_BARRIER_ARRIVAL_TOKEN: barrierArrivalToken,
  },
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

try {
  await waitUntilReady(baseUrl, server);
  const smoke = spawn(process.execPath, [fileURLToPath(new URL("./starter-runtime-smoke.mjs", import.meta.url))], {
    stdio: "inherit",
    env: {
      ...process.env,
      DLC_STARTER_URL: baseUrl,
      DLC_GRADER_TOKEN: graderToken,
      DLC_BARRIER_CONTROL_URL: mentorBaseUrl,
      MENTOR_SERVICE_ADMIN_TOKEN: mentorAdminToken,
    },
  });
  const exitCode = await new Promise((resolve, reject) => {
    smoke.once("error", reject);
    smoke.once("exit", (code, signal) => signal ? reject(new Error(`runtime smoke가 ${signal}로 종료했습니다.`)) : resolve(code));
  });
  if (exitCode !== 0) throw new Error(`runtime smoke가 exit ${exitCode}로 실패했습니다.`);
} catch (error) {
  process.stderr.write(serverOutput);
  throw error;
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  await new Promise((resolve, reject) => mentor.server.close((error) => error ? reject(error) : resolve()));
}
