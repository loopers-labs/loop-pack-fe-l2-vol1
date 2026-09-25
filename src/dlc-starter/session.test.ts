import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDlcSessionToken,
  DLC_ACCOUNTS,
  verifyDlcSessionToken,
} from "./session";

describe("DLC role and audience sessions", () => {
  beforeEach(() => {
    vi.stubEnv("WEB_SESSION_SECRET", "web-test-secret");
    vi.stubEnv("ADMIN_SESSION_SECRET", "admin-test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only the role and audience bound to each app", () => {
    const webCustomer = createDlcSessionToken({
      accountAlias: "customer-a",
      signingApp: "web",
      nowMs: 1_000,
    });
    const admin = createDlcSessionToken({
      accountAlias: "admin-a",
      signingApp: "admin",
      nowMs: 1_000,
    });

    expect(verifyDlcSessionToken(webCustomer, "web", 2_000)).toEqual(
      DLC_ACCOUNTS["customer-a"],
    );
    expect(verifyDlcSessionToken(webCustomer, "admin", 2_000)).toBeNull();
    expect(verifyDlcSessionToken(admin, "admin", 2_000)).toEqual(DLC_ACCOUNTS["admin-a"]);
    expect(verifyDlcSessionToken(admin, "web", 2_000)).toBeNull();
  });

  it("rejects a correct role with the wrong audience independently", () => {
    const wrongWebAudience = createDlcSessionToken({
      accountAlias: "customer-b",
      signingApp: "web",
      audience: "admin",
      nowMs: 1_000,
    });
    const wrongAdminAudience = createDlcSessionToken({
      accountAlias: "admin-b",
      signingApp: "admin",
      audience: "web",
      nowMs: 1_000,
    });

    expect(verifyDlcSessionToken(wrongWebAudience, "web", 2_000)).toBeNull();
    expect(verifyDlcSessionToken(wrongAdminAudience, "admin", 2_000)).toBeNull();
  });

  it("rejects a wrong role even when signature and audience match", () => {
    const adminOnWeb = createDlcSessionToken({
      accountAlias: "admin-a",
      signingApp: "web",
      audience: "web",
      nowMs: 1_000,
    });
    const customerOnAdmin = createDlcSessionToken({
      accountAlias: "customer-a",
      signingApp: "admin",
      audience: "admin",
      nowMs: 1_000,
    });

    expect(verifyDlcSessionToken(adminOnWeb, "web", 2_000)).toBeNull();
    expect(verifyDlcSessionToken(customerOnAdmin, "admin", 2_000)).toBeNull();
  });

  it("rejects an expired or tampered token", () => {
    const token = createDlcSessionToken({
      accountAlias: "customer-a",
      signingApp: "web",
      nowMs: 1_000,
    });

    expect(verifyDlcSessionToken(token, "web", 3_602_000)).toBeNull();
    expect(verifyDlcSessionToken(`${token}x`, "web", 2_000)).toBeNull();
  });
});
