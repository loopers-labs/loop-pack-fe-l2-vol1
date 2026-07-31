import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runScript(script: string, args: string[] = []) {
  return spawnSync(pnpm, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
}

describe("Week 7 verification contract", () => {
  it("reports a clean Basic starter as INCOMPLETE instead of INFRA_ERROR", () => {
    const result = runScript("verify:week07:submission", ["--advanced=none"]);

    expect(result.status).toBe(2);
    expect(`${result.stdout}\n${result.stderr}`).toContain("[INCOMPLETE]");
    expect(`${result.stdout}\n${result.stderr}`).not.toContain("[INFRA_ERROR]");
  });

  it("verifies the Basic checkpoint and evidence-template starter contract", () => {
    const result = runScript("verify:week07:starter", [
      "--scope=basic-checkpoints",
    ]);

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      "[PASS] Basic checkpoints",
    );
  });

  it("accepts only the isolated Week 7 assignment diff", () => {
    const result = runScript("verify:week07:starter", [
      "--scope=protected-files",
    ]);

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      "[PASS] Protected files",
    );
  });
});
