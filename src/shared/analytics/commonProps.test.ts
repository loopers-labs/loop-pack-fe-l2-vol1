import { describe, expect, it } from "vitest";
import { detectDevice } from "./commonProps";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36";

describe("detectDevice", () => {
  it("모바일/태블릿/pc 를 구분한다 — 태블릿은 모바일보다 먼저 판정된다", () => {
    expect(detectDevice(IPHONE)).toBe("mobile");
    expect(detectDevice(ANDROID_PHONE)).toBe("mobile");
    expect(detectDevice(IPAD)).toBe("tablet");
    // "Mobile" 없는 안드로이드 = 태블릿 (mobile 규칙에 먼저 걸리면 안 됨)
    expect(detectDevice(ANDROID_TABLET)).toBe("tablet");
    expect(detectDevice(DESKTOP)).toBe("pc");
  });
});
