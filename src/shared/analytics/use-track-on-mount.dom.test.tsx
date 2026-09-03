import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { resetAnalyticsForTest } from "@/analytics/logger";
import type { AnalyticsProvider, EventProperties } from "@/analytics/provider";
import { resetSharedAnalyticsForTest, setupAnalytics } from "./analytics";
import { useTrackOnMount } from "./use-track-on-mount";

const createRecorder = () => {
  const recorded: Array<{ event: string; properties: EventProperties }> = [];
  const provider: AnalyticsProvider = {
    name: "recorder",
    initialize: () => {},
    track: (event, properties) => recorded.push({ event, properties }),
    identify: () => {},
    reset: () => {},
  };
  return { provider, recorded };
};

function ListProbe({ page, enabled = true }: { page: number; enabled?: boolean }) {
  useTrackOnMount(
    "product_list_view",
    { category: "all", sort: "latest", page, hasQuery: false },
    enabled,
  );
  return null;
}

describe("useTrackOnMount", () => {
  afterEach(() => {
    resetAnalyticsForTest();
    resetSharedAnalyticsForTest();
  });

  it("StrictMode 의 effect 재실행에도 한 번만 보낸다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    render(
      <StrictMode>
        <ListProbe page={1} />
      </StrictMode>,
    );

    expect(recorded).toHaveLength(1);
  });

  it("프로퍼티가 바뀌어도 다시 보내지 않는다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    const { rerender } = render(<ListProbe page={1} />);
    rerender(<ListProbe page={2} />);

    expect(recorded).toHaveLength(1);
    expect(recorded[0].properties).toMatchObject({ page: 1 });
  });

  it("enabled 가 false 면 보내지 않고, true 로 바뀐 뒤 한 번만 보낸다", async () => {
    const { provider, recorded } = createRecorder();
    await setupAnalytics([provider]);

    const { rerender } = render(<ListProbe page={1} enabled={false} />);
    expect(recorded).toHaveLength(0);

    rerender(<ListProbe page={1} enabled />);
    rerender(<ListProbe page={1} enabled={false} />);
    rerender(<ListProbe page={1} enabled />);

    expect(recorded).toHaveLength(1);
  });

  it("초기화 컴포넌트보다 먼저 마운트된 화면의 이벤트에도 공통 프로퍼티가 붙는다", async () => {
    const { provider, recorded } = createRecorder();

    render(<ListProbe page={1} />);
    await setupAnalytics([provider]);

    expect(recorded).toHaveLength(1);
    expect(recorded[0].properties).toMatchObject({
      sessionId: expect.stringMatching(/^s_/),
      device: expect.any(String),
      ts: expect.any(String),
    });
  });
});
