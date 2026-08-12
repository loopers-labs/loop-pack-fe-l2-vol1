import type { MockApiScenario } from "@/types/commerce";
import { createLoader, parseAsStringLiteral, type inferParserType } from "nuqs/server";

const scenarioValues = ["slow", "empty", "error"] as const satisfies readonly MockApiScenario[];

export const homeSearchParsers = {
  scenario: parseAsStringLiteral(scenarioValues),
};

export type HomeSearchState = inferParserType<typeof homeSearchParsers>;

// 서버(metadata·본문)에서 URL의 측정용 scenario를 같은 파서로 정규화한다
export const loadHomeSearchParams = createLoader(homeSearchParsers);
